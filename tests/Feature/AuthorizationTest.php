<?php

namespace Tests\Feature;

use App\Core\Authorization\CorePermissions;
use App\Core\Modules\ModuleRegistry;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_core_permission_catalog_syncs_without_deleting_assignments(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $this->assertSame(
            count(CorePermissions::names()) + count($this->app->make(ModuleRegistry::class)->permissionDefinitions()),
            Permission::query()->whereNull('obsolete_at')->count(),
        );
        $this->assertSame(0, Permission::query()->whereNotNull('obsolete_at')->count());
        $this->assertTrue(Permission::query()->where('name', 'users.create')->exists());

        $legacy = Permission::query()->create(['name' => 'legacy.thing', 'module' => 'legacy']);
        $role = Role::query()->create(['slug' => 'legacy-role', 'name' => 'Legacy']);
        $role->permissions()->attach($legacy);

        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $this->assertNotNull($legacy->fresh()->obsolete_at);
        $this->assertSame(1, $role->permissions()->where('permissions.name', 'legacy.thing')->count());
    }

    public function test_guest_cannot_reach_admin_endpoints(): void
    {
        $user = User::query()->create(['name' => 'Pessoa', 'email' => 'person@example.test']);
        $role = Role::query()->create(['slug' => 'operator', 'name' => 'Operador']);

        $this->getJson('/api/v1/admin/users')->assertUnauthorized();
        $this->postJson('/api/v1/admin/users', [])->assertUnauthorized();
        $this->getJson('/api/v1/admin/users/'.$user->getKey())->assertUnauthorized();
        $this->patchJson('/api/v1/admin/users/'.$user->getKey(), [])->assertUnauthorized();
        $this->deleteJson('/api/v1/admin/users/'.$user->getKey())->assertUnauthorized();
        $this->getJson('/api/v1/admin/roles')->assertUnauthorized();
        $this->postJson('/api/v1/admin/roles', [])->assertUnauthorized();
        $this->getJson('/api/v1/admin/roles/'.$role->getKey())->assertUnauthorized();
        $this->patchJson('/api/v1/admin/roles/'.$role->getKey(), [])->assertUnauthorized();
        $this->deleteJson('/api/v1/admin/roles/'.$role->getKey())->assertUnauthorized();
        $this->getJson('/api/v1/admin/permissions')->assertUnauthorized();
    }

    public function test_authenticated_user_without_permission_receives_forbidden(): void
    {
        $actor = User::query()->create(['name' => 'Pessoa', 'email' => 'person@example.test']);
        $target = User::query()->create(['name' => 'Alvo', 'email' => 'target@example.test']);
        $role = Role::query()->create(['slug' => 'operator', 'name' => 'Operador']);

        $this->actingAs($actor);

        $this->getJson('/api/v1/admin/users')->assertForbidden()->assertJsonPath('error.code', 'FORBIDDEN');
        $this->postJson('/api/v1/admin/users', ['name' => 'Nova', 'email' => 'nova@example.test'])->assertForbidden();
        $this->getJson('/api/v1/admin/users/'.$target->getKey())->assertForbidden();
        $this->patchJson('/api/v1/admin/users/'.$target->getKey(), ['name' => 'Outra'])->assertForbidden();
        $this->deleteJson('/api/v1/admin/users/'.$target->getKey())->assertForbidden();
        $this->getJson('/api/v1/admin/roles')->assertForbidden();
        $this->postJson('/api/v1/admin/roles', ['slug' => 'novo', 'name' => 'Novo'])->assertForbidden();
        $this->getJson('/api/v1/admin/roles/'.$role->getKey())->assertForbidden();
        $this->patchJson('/api/v1/admin/roles/'.$role->getKey(), ['name' => 'Outro'])->assertForbidden();
        $this->deleteJson('/api/v1/admin/roles/'.$role->getKey())->assertForbidden();
        $this->getJson('/api/v1/admin/permissions')->assertForbidden();

        $this->assertSame('Alvo', $target->fresh()->name);
        $this->assertSame('Operador', $role->fresh()->name);
    }

    public function test_authorized_user_manages_users_and_creation_sends_password_link(): void
    {
        $actor = $this->userWithPermissions([
            'users.viewAny', 'users.view', 'users.create', 'users.update', 'users.delete',
        ]);
        $operatorRole = Role::query()->create(['slug' => 'operator', 'name' => 'Operador']);

        $this->actingAs($actor);
        Notification::fake();

        $created = $this->postJson('/api/v1/admin/users', [
            'name' => 'Nova Pessoa',
            'email' => 'NOVA@example.test',
            'roles' => ['operator'],
        ])->assertCreated()
            ->assertJsonPath('data.email', 'nova@example.test')
            ->assertJsonPath('data.roles', ['operator'])
            ->assertJsonMissingPath('data.password');

        $newUser = User::query()->where('email', 'nova@example.test')->sole();
        $this->assertNull($newUser->password);
        $this->assertTrue($newUser->roles->contains('slug', 'operator'));
        $this->assertTrue($operatorRole->users()->whereKey($newUser->getKey())->exists());

        Notification::assertSentTo($newUser, ResetPassword::class, function (ResetPassword $notification) use ($newUser): bool {
            return str_contains($notification->toMail($newUser)->actionUrl, '/reset-password?token=');
        });

        $this->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonStructure(['data', 'links', 'meta' => ['currentPage', 'perPage', 'total']]);

        $this->getJson('/api/v1/admin/users/'.$newUser->getKey())
            ->assertOk()->assertJsonPath('data.email', 'nova@example.test');

        $this->patchJson('/api/v1/admin/users/'.$newUser->getKey(), ['name' => 'Renomeada'])
            ->assertOk()->assertJsonPath('data.name', 'Renomeada');

        $this->patchJson('/api/v1/admin/users/'.$newUser->getKey(), ['roles' => []])
            ->assertOk()->assertJsonPath('data.roles', []);

        $this->deleteJson('/api/v1/admin/users/'.$newUser->getKey())->assertNoContent();
        $this->assertNull($newUser->fresh());
    }

    public function test_user_management_validates_payload(): void
    {
        $actor = $this->userWithPermissions(['users.create', 'users.update']);

        $this->actingAs($actor);

        $this->postJson('/api/v1/admin/users', ['name' => 'Sem e-mail'])
            ->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['details' => ['fields' => ['email']]]]);

        $this->postJson('/api/v1/admin/users', [
            'name' => 'Nova', 'email' => 'nova@example.test', 'roles' => ['missing-role'],
        ])->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['fields' => ['roles.0']]]]);

        $existing = User::query()->create(['name' => 'Pessoa', 'email' => 'person@example.test']);
        $this->postJson('/api/v1/admin/users', ['name' => 'Outra', 'email' => 'person@example.test'])
            ->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['fields' => ['email']]]]);
        $this->assertSame(2, User::query()->count());

        $this->patchJson('/api/v1/admin/users/'.$existing->getKey(), ['email' => 'invalid'])
            ->assertStatus(422);
    }

    public function test_authorized_user_manages_roles_and_permission_catalog(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $actor = $this->userWithPermissions(['roles.viewAny', 'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'permissions.viewAny']);
        $this->actingAs($actor);

        $this->getJson('/api/v1/admin/permissions')
            ->assertOk()
            ->assertJsonFragment(['name' => 'users.create', 'module' => 'core', 'obsolete' => false]);

        $created = $this->postJson('/api/v1/admin/roles', [
            'slug' => 'editor',
            'name' => 'Editor',
            'permissions' => ['users.viewAny', 'users.view'],
        ])->assertCreated()
            ->assertJsonPath('data.slug', 'editor')
            ->assertJsonPath('data.permissions', ['users.view', 'users.viewAny'])
            ->assertJsonPath('data.isSystem', false);

        $role = Role::query()->where('slug', 'editor')->sole();
        $this->assertSame(2, $role->permissions()->count());

        $this->getJson('/api/v1/admin/roles')
            ->assertOk()->assertJsonStructure(['data', 'links', 'meta' => ['currentPage', 'perPage', 'total']]);

        $this->getJson('/api/v1/admin/roles/'.$role->getKey())
            ->assertOk()->assertJsonPath('data.slug', 'editor');

        $this->patchJson('/api/v1/admin/roles/'.$role->getKey(), ['name' => 'Editor Sênior', 'permissions' => ['users.view']])
            ->assertOk()->assertJsonPath('data.name', 'Editor Sênior')->assertJsonPath('data.permissions', ['users.view']);

        $this->deleteJson('/api/v1/admin/roles/'.$role->getKey())->assertNoContent();
        $this->assertNull($role->fresh());
    }

    public function test_role_in_use_and_system_role_are_protected(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $actor = $this->superAdmin();
        $this->actingAs($actor);

        $role = Role::query()->create(['slug' => 'operator', 'name' => 'Operador']);
        $member = User::query()->create(['name' => 'Membro', 'email' => 'member@example.test']);
        $member->roles()->attach($role);

        $this->deleteJson('/api/v1/admin/roles/'.$role->getKey())
            ->assertStatus(409)->assertJsonPath('error.code', 'CONFLICT');

        $superAdminRole = Role::query()->where('slug', Role::SUPER_ADMIN)->sole();
        $this->patchJson('/api/v1/admin/roles/'.$superAdminRole->getKey(), ['name' => 'Outro'])
            ->assertStatus(409);
        $this->deleteJson('/api/v1/admin/roles/'.$superAdminRole->getKey())->assertStatus(409);
    }

    public function test_last_super_admin_cannot_be_removed_and_role_is_superadmin_only(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $root = $this->superAdmin();
        $this->actingAs($root);

        $this->patchJson('/api/v1/admin/users/'.$root->getKey(), ['roles' => []])
            ->assertStatus(409)->assertJsonPath('error.code', 'CONFLICT');
        $this->deleteJson('/api/v1/admin/users/'.$root->getKey())->assertStatus(409);
        $this->assertNotNull($root->fresh());
        $this->assertTrue($root->fresh()->isSuperAdmin());

        $second = $this->superAdmin('second@example.test');
        $this->deleteJson('/api/v1/admin/users/'.$root->getKey())->assertNoContent();
        $this->assertNull($root->fresh());

        $manager = $this->userWithPermissions(['users.create', 'users.update'], 'manager@example.test');
        $this->actingAs($manager);
        $this->postJson('/api/v1/admin/users', [
            'name' => 'Quer Admin', 'email' => 'wants-admin@example.test', 'roles' => [Role::SUPER_ADMIN],
        ])->assertForbidden();
        $this->patchJson('/api/v1/admin/users/'.$second->getKey(), ['roles' => [Role::SUPER_ADMIN]])
            ->assertForbidden();
    }

    public function test_authenticated_user_payload_exposes_effective_permissions(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $role = Role::query()->create(['slug' => 'operator', 'name' => 'Operador']);
        $role->permissions()->sync(Permission::query()->whereIn('name', ['users.viewAny', 'users.view'])->pluck('id'));

        $user = User::query()->create(['name' => 'Operador', 'email' => 'operator@example.test']);
        $user->roles()->attach($role);

        $this->actingAs($user);
        $this->getJson('/api/v1/auth/user')
            ->assertOk()
            ->assertJsonPath('data.roles', ['operator'])
            ->assertJsonPath('data.isSuperAdmin', false)
            ->assertJsonPath('data.permissions', ['users.view', 'users.viewAny']);

        $root = $this->superAdmin('root@example.test');
        $this->actingAs($root);
        $response = $this->getJson('/api/v1/auth/user')->assertOk();
        $response->assertJsonPath('data.isSuperAdmin', true);
        $this->assertSame(
            Permission::query()->whereNull('obsolete_at')->count(),
            count($response->json('data.permissions')),
        );
        $this->assertContains('roles.create', $response->json('data.permissions'));
    }

    public function test_super_admin_bypasses_module_permission_gates_without_role_assignments(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);
        $this->artisan('inventory:install')->assertExitCode(0);

        $root = $this->superAdmin();
        $this->actingAs($root);

        self::assertSame([], $root->roles()->firstOrFail()->permissions()->pluck('permissions.name')->all());
        self::assertTrue($root->hasPermission('inventory.dashboard.view'));
        self::assertTrue($root->hasPermission('inventory.imports.execute'));

        $this->getJson('/api/v1/inventory/dashboard')->assertOk();
        $this->getJson('/api/v1/inventory/movements?perPage=50')->assertOk();
        $this->getJson('/api/v1/inventory/reports/stock?perPage=20')->assertOk();
        $this->getJson('/api/v1/inventory/imports')->assertOk();
    }

    /**
     * @param  array<int, string>  $permissions
     */
    private function userWithPermissions(array $permissions, string $email = 'actor@example.test'): User
    {
        $role = Role::query()->create(['slug' => 'actor-'.Str::lower(Str::random(8)), 'name' => 'Ator']);

        foreach ($permissions as $name) {
            Permission::query()->firstOrCreate(['name' => $name], ['module' => 'core']);
        }

        $role->permissions()->sync(
            Permission::query()->whereIn('name', $permissions)->pluck('id'),
        );

        $user = User::query()->create(['name' => 'Ator', 'email' => $email]);
        $user->roles()->attach($role);

        return $user;
    }

    private function superAdmin(string $email = 'root@example.test'): User
    {
        $role = Role::query()->firstOrCreate(['slug' => Role::SUPER_ADMIN], ['name' => 'Superadministrador']);
        $user = User::query()->create(['name' => 'Root', 'email' => $email]);
        $user->roles()->attach($role);

        return $user;
    }
}
