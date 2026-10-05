<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\TestUsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Tests\TestCase;

class TestUsersSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_default_seed_command_creates_users_and_permission_catalog(): void
    {
        $this->artisan('db:seed')->assertExitCode(0);

        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseHas('permissions', ['name' => 'users.create', 'obsolete_at' => null]);
        $admin = User::query()->where('email', 'admin@example.test')->sole();
        $this->assertContains('users.create', $admin->permissionNames());
    }

    public function test_seeder_creates_users_with_hashed_passwords_and_distinct_access(): void
    {
        $this->seed(TestUsersSeeder::class);

        $admin = User::query()->where('email', 'admin@example.test')->sole();
        $user = User::query()->where('email', 'user@example.test')->sole();

        $this->assertTrue($admin->isSuperAdmin());
        $this->assertFalse($user->isSuperAdmin());
        $this->assertTrue(Hash::check('Teste@12345678', $admin->password));
        $this->assertTrue(Hash::check('Teste@12345678', $user->password));
        $this->actingAs($admin)->getJson('/api/v1/admin/users')->assertOk();
        $this->actingAs($user)->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_rerunning_preserves_existing_accounts_and_roles(): void
    {
        $this->seed(TestUsersSeeder::class);
        $admin = User::query()->where('email', 'admin@example.test')->sole();
        $admin->name = 'Nome alterado';
        $admin->password = Hash::make('Outra senha de teste');
        $admin->save();
        $admin->roles()->detach();

        $this->seed(TestUsersSeeder::class);

        $this->assertSame(2, User::query()->count());
        $this->assertSame('Nome alterado', $admin->fresh()->name);
        $this->assertTrue(Hash::check('Outra senha de teste', $admin->fresh()->password));
        $this->assertFalse($admin->fresh()->isSuperAdmin());
    }

    public function test_seeder_refuses_production_before_creating_accounts(): void
    {
        $this->app->instance('env', 'production');

        try {
            $this->app->make(TestUsersSeeder::class)->run();
            $this->fail('O seed deveria recusar produção.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('local ou testing', $exception->getMessage());
            $this->assertDatabaseCount('users', 0);
        }
    }
}
