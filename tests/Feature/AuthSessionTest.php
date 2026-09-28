<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(?string $password = 'correct-password-123'): User
    {
        $user = User::create(['name' => 'Pessoa', 'email' => 'person@example.test']);
        $user->password = $password === null ? null : Hash::make($password);
        $user->save();

        return $user;
    }

    public function test_first_admin_is_provisioned_once_without_default_credentials(): void
    {
        $this->artisan('core:bootstrap-admin', ['email' => 'ADMIN@example.test', 'name' => 'Admin'])
            ->expectsQuestion('Senha inicial (não exibida)', 'a-long-initial-password')
            ->expectsQuestion('Confirme a senha inicial', 'a-long-initial-password')
            ->assertExitCode(0);

        $admin = User::sole();
        $this->assertSame('admin@example.test', $admin->email);
        $this->assertTrue(Hash::check('a-long-initial-password', $admin->password));
        $this->assertSame('super-admin', $admin->roles()->sole()->slug);
        $this->assertSame(1, Role::count());

        $this->artisan('core:bootstrap-admin', ['email' => 'admin@example.test', 'name' => 'Another'])
            ->assertExitCode(0);
        $this->artisan('core:bootstrap-admin', ['email' => 'another@example.test', 'name' => 'Another'])
            ->assertExitCode(1);
        $this->assertSame(1, User::count());
    }

    public function test_guest_auth_endpoints_are_protected_and_csrf_cookie_is_available(): void
    {
        $this->getJson('/api/v1/auth/user')->assertUnauthorized()->assertJsonPath('error.code', 'UNAUTHENTICATED');
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
        $this->putJson('/api/v1/auth/password', [])->assertUnauthorized();
        $this->postJson('/api/v1/register', [])->assertNotFound();
        $this->get('/sanctum/csrf-cookie')->assertNoContent()->assertCookie('XSRF-TOKEN');
    }

    public function test_csrf_is_required_outside_testing_mode_and_valid_token_reaches_validation(): void
    {
        $this->app->instance('env', 'local');

        $this->postJson('/api/v1/auth/login', [])->assertStatus(419)
            ->assertJsonPath('error.code', 'SESSION_EXPIRED');

        $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $this->withHeader('X-CSRF-TOKEN', session()->token())
            ->postJson('/api/v1/auth/login', [])->assertStatus(422)
            ->assertJsonPath('error.code', 'VALIDATION_FAILED');
    }

    public function test_login_regenerates_session_and_logout_invalidates_it(): void
    {
        $user = $this->makeUser();
        $this->get('/sanctum/csrf-cookie')->assertNoContent();
        $previousId = session()->getId();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertStatus(422)->assertJsonPath('error.details.fields.email.0', 'Credenciais inválidas.');

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'correct-password-123'])
            ->assertOk()->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.roles', [])->assertJsonPath('data.permissions', []);
        $this->assertNotSame($previousId, session()->getId());
        $this->getJson('/api/v1/auth/user')->assertOk()->assertJsonPath('data.email', $user->email)
            ->assertJsonMissingPath('data.password');

        $this->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
    }

    public function test_account_without_first_password_cannot_login_but_can_receive_a_link(): void
    {
        $user = $this->makeUser(null);
        Notification::fake();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'correct-password-123'])
            ->assertStatus(422);
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(202);
        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token, $user): bool {
            $token = $notification->token;

            return str_contains($notification->toMail($user)->actionUrl, '/reset-password?token=');
        });
        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email, 'token' => $token,
            'password' => 'first-secure-password-123', 'passwordConfirmation' => 'first-secure-password-123',
        ])->assertNoContent();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'first-secure-password-123'])
            ->assertOk();
    }

    public function test_recovery_is_neutral_and_token_is_single_use_and_revokes_sessions(): void
    {
        $user = $this->makeUser();
        Notification::fake();

        $missing = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.test']);
        $sent = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email]);
        $missing->assertStatus(202);
        $sent->assertStatus(202);
        $this->assertSame($missing->json(), $sent->json());

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        $this->assertNotNull($token);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'correct-password-123'])
            ->assertOk();
        $this->getJson('/api/v1/auth/user')->assertOk();
        $this->assertGreaterThanOrEqual(1, DB::table('sessions')->where('user_id', $user->id)->count());

        DB::table('sessions')->insert([
            'id' => 'previous-session', 'user_id' => $user->id, 'payload' => 'old', 'last_activity' => time(),
        ]);

        $payload = [
            'email' => $user->email, 'token' => $token,
            'password' => 'new-secure-password-123', 'passwordConfirmation' => 'new-secure-password-123',
        ];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertNoContent();
        $this->getJson('/api/v1/auth/user')->assertUnauthorized();
        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->id)->count());
        $this->assertTrue(Hash::check('new-secure-password-123', $user->fresh()->password));
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422)
            ->assertJsonPath('error.details.fields.token.0', 'Link inválido ou expirado.');
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'correct-password-123'])
            ->assertStatus(422);
    }

    public function test_invalid_and_expired_reset_tokens_are_rejected(): void
    {
        $user = $this->makeUser();
        Notification::fake();

        $payload = [
            'email' => $user->email, 'token' => 'invalid-token',
            'password' => 'new-secure-password-123', 'passwordConfirmation' => 'new-secure-password-123',
        ];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(202);
        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        $payload['token'] = $token;
        $this->travel(61)->minutes();
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);
        $this->assertTrue(Hash::check('correct-password-123', $user->fresh()->password));
    }

    public function test_password_change_checks_current_password_and_keeps_current_session(): void
    {
        $user = $this->makeUser();
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'correct-password-123'])->assertOk();

        $payload = [
            'currentPassword' => 'wrong', 'password' => 'another-secure-password',
            'passwordConfirmation' => 'another-secure-password',
        ];
        $this->putJson('/api/v1/auth/password', $payload)->assertStatus(422);
        $payload['currentPassword'] = 'correct-password-123';
        $this->putJson('/api/v1/auth/password', $payload)->assertNoContent();
        $this->getJson('/api/v1/auth/user')->assertOk();
        $this->assertTrue(Hash::check('another-secure-password', $user->fresh()->password));
    }

    public function test_login_and_recovery_are_rate_limited(): void
    {
        $user = $this->makeUser();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
                ->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertStatus(429)->assertJsonPath('error.code', 'RATE_LIMITED');

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.test'])
                ->assertStatus(202);
        }
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'missing@example.test'])
            ->assertStatus(429);
    }
}
