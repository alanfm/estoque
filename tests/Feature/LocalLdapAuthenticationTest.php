<?php

namespace Tests\Feature;

use App\Core\Auth\Exceptions\LdapUnavailableException;
use App\Core\Auth\Ldap\LdapAuthenticator;
use App\Core\Auth\Ldap\LdapProfile;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LocalLdapAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['auth.mode' => 'ldap']);
        Cache::forget('auth.ldap.circuit-open');
    }

    private function stubLdap(bool $result, bool $unavailable = false, bool $circuitOpen = false): void
    {
        $adapter = new class($result, $unavailable, $circuitOpen) extends LdapAuthenticator
        {
            public function __construct(private bool $result, private bool $unavailable, private bool $open) {}

            public function circuitOpen(): bool
            {
                return $this->open;
            }

            public function authenticate(string $registry, string $password): bool
            {
                if ($this->unavailable) {
                    throw new LdapUnavailableException;
                }

                return $this->result;
            }

            public function authenticateProfile(string $registry, string $password): ?LdapProfile
            {
                if ($this->unavailable) {
                    throw new LdapUnavailableException;
                }

                return $this->result ? new LdapProfile('Pessoa LDAP', 'novo@example.test', str_repeat('a', 32)) : null;
            }
        };
        $this->app->instance(LdapAuthenticator::class, $adapter);
    }

    private function user(array $attributes = []): User
    {
        $user = User::query()->create($attributes + [
            'name' => 'Pessoa', 'email' => 'pessoa@example.test', 'registry' => '0012345',
            'ldap_enabled' => true, 'local_auth_enabled' => true,
        ]);

        return $user;
    }

    public function test_options_report_only_public_login_capabilities_without_caching(): void
    {
        $this->getJson('/api/v1/auth/options')->assertOk()
            ->assertJsonPath('data.localEnabled', true)
            ->assertJsonPath('data.ldapEnabled', true)
            ->assertHeader('Cache-Control', 'no-store, private');

        config(['auth.mode' => 'local']);
        $this->getJson('/api/v1/auth/options')->assertJsonPath('data.ldapEnabled', false);
    }

    public function test_valid_ldap_bind_authenticates_the_preprovisioned_local_user(): void
    {
        $this->stubLdap(true);
        $user = $this->user(['password' => null]);

        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'directory-secret'])
            ->assertOk()->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.authentication.provider', 'ldap')
            ->assertJsonPath('data.authentication.canChangeLocalPassword', true);
        $this->assertNull($user->fresh()->password);
    }

    public function test_ldap_rejection_can_fall_back_only_to_enabled_local_password(): void
    {
        $this->stubLdap(false);
        $user = $this->user();
        $user->password = Hash::make('local-secret-123');
        $user->save();

        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'local-secret-123'])
            ->assertOk()->assertJsonPath('data.authentication.provider', 'local');

        auth()->logout();
        $user->local_auth_enabled = false;
        $user->save();
        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'local-secret-123'])
            ->assertStatus(422);
    }

    public function test_ldap_outage_uses_allowed_local_password_or_returns_sanitized_503(): void
    {
        $user = $this->user();
        $user->password = Hash::make('local-secret-123');
        $user->save();
        $this->stubLdap(false, true);
        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'local-secret-123'])
            ->assertOk()->assertJsonPath('data.authentication.provider', 'local');

        auth()->logout();
        $user->local_auth_enabled = false;
        $user->save();
        Cache::forget('auth.ldap.circuit-open');
        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'wrong'])
            ->assertStatus(503)->assertJsonPath('error.code', 'AUTH_PROVIDER_UNAVAILABLE')
            ->assertHeader('Retry-After', '30');
    }

    public function test_open_ldap_circuit_still_allows_an_authorized_local_fallback(): void
    {
        $user = $this->user();
        $user->password = Hash::make('local-secret-123');
        $user->save();
        $this->stubLdap(false, false, true);

        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0012345', 'password' => 'local-secret-123'])
            ->assertOk()->assertJsonPath('data.authentication.provider', 'local');
    }

    public function test_valid_ldap_login_provisions_unknown_registry_without_roles(): void
    {
        $this->stubLdap(true);
        $this->postJson('/api/v1/auth/login', ['provider' => 'ldap', 'registry' => '0000001', 'password' => 'directory-secret'])
            ->assertOk()->assertJsonPath('data.accountSource', 'ldap')
            ->assertJsonPath('data.roles', [])->assertJsonPath('data.permissions', []);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_ldap_only_users_do_not_receive_local_reset_links_or_change_local_password(): void
    {
        Notification::fake();
        $user = $this->user(['local_auth_enabled' => false, 'password' => null]);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(202);
        Notification::assertNothingSent();

        $this->actingAs($user)->putJson('/api/v1/auth/password', [
            'currentPassword' => 'anything', 'password' => 'new-local-password-123',
            'passwordConfirmation' => 'new-local-password-123',
        ])->assertForbidden()->assertJsonPath('error.code', 'LOCAL_PASSWORD_DISABLED');
    }

    public function test_admin_can_create_ldap_only_account_without_local_password_invitation(): void
    {
        $adminRole = Role::query()->create(['slug' => Role::SUPER_ADMIN, 'name' => 'Superadministrador']);
        $admin = $this->user(['registry' => null, 'ldap_enabled' => false]);
        $admin->roles()->attach($adminRole);
        $this->actingAs($admin);
        Notification::fake();

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Conta IFCE', 'email' => 'ifce@example.test', 'registry' => ' 0012345 ',
            'ldapEnabled' => true, 'localAuthEnabled' => false,
        ])->assertCreated()->assertJsonPath('data.registry', '0012345')
            ->assertJsonPath('data.ldapEnabled', true)->assertJsonPath('data.localAuthEnabled', false);

        $newUser = User::query()->where('email', 'ifce@example.test')->sole();
        $this->assertNull($newUser->password);
        Notification::assertNothingSent();

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Duplicada', 'email' => 'duplicada@example.test', 'registry' => '0012345',
            'ldapEnabled' => true, 'localAuthEnabled' => false,
        ])->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['fields' => ['registry']]]]);
    }
}
