<?php

namespace Tests\Feature;

use App\Core\Auth\Ldap\LdapAuthenticator;
use App\Core\Auth\Ldap\LdapProfile;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Tests\Fixtures\Ldap\FakeLdapAuthenticator;
use Tests\TestCase;

class LdapProvisioningTest extends TestCase
{
    use RefreshDatabase;

    private function directory(?LdapProfile $profile = null, bool $unavailable = false): FakeLdapAuthenticator
    {
        config(['auth.mode' => 'ldap']);
        $adapter = new FakeLdapAuthenticator($profile, $unavailable);
        $this->app->instance(LdapAuthenticator::class, $adapter);

        return $adapter;
    }

    private function profile(string $email = 'institutional@example.test', string $id = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'): LdapProfile
    {
        return new LdapProfile('Nome institucional', $email, $id);
    }

    private function login(): TestResponse
    {
        return $this->postJson('/api/v1/auth/login', ['registry' => '0012345', 'password' => 'directory-secret']);
    }

    public function test_unknown_user_is_created_only_after_success_and_never_receives_permissions_or_password(): void
    {
        Notification::fake();
        $this->directory($this->profile());
        $this->login()->assertOk()->assertJsonPath('data.registry', '0012345')
            ->assertJsonPath('data.accountSource', 'ldap')->assertJsonPath('data.roles', [])
            ->assertJsonPath('data.permissions', [])->assertJsonPath('data.authentication.canChangeLocalPassword', false);
        $user = User::sole();
        $this->assertTrue($user->ldap_managed);
        $this->assertTrue($user->ldap_enabled);
        $this->assertFalse($user->local_auth_enabled);
        $this->assertNull($user->password);
        Notification::assertNothingSent();
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->getJson('/api/v1/inventory/dashboard')->assertForbidden();
        $this->getJson('/api/v1/inventory/items')->assertForbidden();
        $this->postJson('/api/v1/inventory/movements', [])->assertForbidden();
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->login()->assertOk()->assertJsonPath('data.id', $user->id);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_rejected_bind_and_outage_do_not_create_users(): void
    {
        $this->directory();
        $this->login()->assertStatus(422);
        $this->assertDatabaseCount('users', 0);
        $this->directory(unavailable: true);
        $this->login()->assertStatus(503);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_email_collision_does_not_link_or_grant_access_to_existing_local_admin(): void
    {
        $local = User::create(['name' => 'Local', 'email' => 'institutional@example.test', 'registry' => 'local001']);
        $role = Role::create(['slug' => Role::SUPER_ADMIN, 'name' => 'Administrador']);
        $local->roles()->attach($role);
        $this->directory($this->profile());
        $this->login()->assertStatus(409);
        $this->assertGuest();
        $this->assertDatabaseCount('users', 1);
        $this->assertFalse($local->fresh()->ldap_managed);
    }

    public function test_existing_local_user_is_checked_locally_and_never_queried_in_ldap(): void
    {
        $user = User::create(['name' => 'Local', 'email' => 'local@example.test', 'registry' => '0012345']);
        $user->password = Hash::make('local-secret');
        $user->save();
        $adapter = $this->directory($this->profile());
        $this->login()->assertStatus(422);
        $this->postJson('/api/v1/auth/login', ['registry' => '0012345', 'password' => 'local-secret'])
            ->assertOk()->assertJsonPath('data.authentication.provider', 'local');
        $this->assertSame(0, $adapter->calls);
    }

    public function test_managed_identity_is_locked_but_admin_can_assign_local_roles(): void
    {
        $this->directory($this->profile());
        $this->login()->assertOk();
        $target = User::sole();
        $actor = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'registry' => 'admin001']);
        $actor->roles()->attach(Role::create(['slug' => Role::SUPER_ADMIN, 'name' => 'Administrador']));
        $this->actingAs($actor);
        foreach (['name' => 'Outro nome', 'email' => 'outro@example.test', 'registry' => 'outro001', 'localAuthEnabled' => true] as $field => $value) {
            $this->patchJson('/api/v1/admin/users/'.$target->id, [$field => $value])->assertStatus(422);
        }
        $role = Role::create(['slug' => 'reader', 'name' => 'Leitor']);
        $this->patchJson('/api/v1/admin/users/'.$target->id, ['roles' => ['reader']])->assertOk();
        $this->assertTrue($target->fresh()->roles->contains('id', $role->id));
        $this->assertSame('Nome institucional', $target->fresh()->name);
    }

    public function test_profile_sync_requires_same_directory_identity_and_preserves_roles(): void
    {
        $this->directory($this->profile());
        $this->login()->assertOk();
        $user = User::sole();
        $role = Role::create(['slug' => 'reader', 'name' => 'Leitor']);
        $user->roles()->attach($role);
        $this->directory(new LdapProfile('Nome atualizado', 'new@example.test', $user->ldap_object_id));
        $this->postJson('/api/v1/auth/sync-profile', ['password' => 'directory-secret'])->assertOk()
            ->assertJsonPath('data.name', 'Nome atualizado')->assertJsonPath('data.email', 'new@example.test')
            ->assertJsonPath('data.roles', ['reader']);
        $this->assertNull($user->fresh()->password);
        $this->directory($this->profile(id: str_repeat('b', 32)));
        $this->postJson('/api/v1/auth/sync-profile', ['password' => 'directory-secret'])->assertStatus(422);
        $this->assertSame('new@example.test', $user->fresh()->email);
    }

    public function test_sync_conflict_outage_and_bad_password_preserve_profile(): void
    {
        $this->directory($this->profile());
        $this->login()->assertOk();
        $user = User::sole();
        User::create(['name' => 'Local', 'email' => 'occupied@example.test', 'registry' => 'local001']);
        $this->directory($this->profile('occupied@example.test'));
        $this->postJson('/api/v1/auth/sync-profile', ['password' => 'directory-secret'])->assertStatus(409);
        $this->directory();
        $this->postJson('/api/v1/auth/sync-profile', ['password' => 'wrong'])->assertStatus(422);
        $this->directory(unavailable: true);
        $this->postJson('/api/v1/auth/sync-profile', ['password' => 'directory-secret'])->assertStatus(503);
        $this->assertSame('institutional@example.test', $user->fresh()->email);
    }

    public function test_local_mode_does_not_query_ldap_or_provision_unknown_users(): void
    {
        $adapter = $this->directory($this->profile());
        config(['auth.mode' => 'local']);
        $this->login()->assertStatus(422);
        $this->assertSame(0, $adapter->calls);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_managed_user_cannot_use_local_credentials_even_if_residual_hash_exists(): void
    {
        Notification::fake();
        $this->directory($this->profile());
        $this->login()->assertOk();
        $user = User::sole();
        $user->local_auth_enabled = true;
        $user->password = Hash::make('residual-password');
        $user->save();
        $this->actingAs($user)->putJson('/api/v1/auth/password', [
            'currentPassword' => 'residual-password', 'password' => 'new-local-password', 'passwordConfirmation' => 'new-local-password',
        ])->assertForbidden();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(202);
        Notification::assertNothingSent();
        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['provider' => 'local', 'registry' => '0012345', 'password' => 'residual-password'])->assertStatus(422);
    }
}
