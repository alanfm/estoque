<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class CustomersModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_crud_is_authorized_and_uses_public_resource(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);
        $this->getJson('/api/v1/customers')->assertUnauthorized();

        $unauthorized = $this->userWithPermissions([]);
        $this->actingAs($unauthorized)->postJson('/api/v1/customers', $this->customerInput())->assertForbidden();

        $user = $this->userWithPermissions(['customers.viewAny', 'customers.view', 'customers.create', 'customers.update', 'customers.delete']);
        $this->actingAs($user);

        $this->postJson('/api/v1/customers', ['name' => '', 'email' => 'invalid'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED');

        $created = $this->postJson('/api/v1/customers', $this->customerInput())
            ->assertCreated()
            ->assertJsonPath('data.name', 'Acme Ltda.')
            ->assertJsonMissingPath('data.deleted_at');
        $id = $created->json('data.id');

        $this->patchJson("/api/v1/customers/{$id}", ['company' => 'Acme Brasil'])
            ->assertOk()->assertJsonPath('data.company', 'Acme Brasil');
        $this->getJson('/api/v1/customers?search=Acme%20Brasil&per_page=1')
            ->assertOk()->assertJsonPath('meta.perPage', 1)->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/customers/{$id}")->assertOk()->assertJsonPath('data.email', 'acme@example.test');
        $this->deleteJson("/api/v1/customers/{$id}")->assertNoContent();
        $this->assertDatabaseMissing('customers', ['id' => $id]);
    }

    public function test_customer_permissions_are_checked_for_each_operation(): void
    {
        $this->artisan('core:sync-permissions')->assertExitCode(0);
        $customerId = DB::table('customers')->insertGetId($this->customerInput());

        $this->actingAs($this->userWithPermissions(['customers.viewAny']))
            ->getJson("/api/v1/customers/{$customerId}")->assertForbidden();
        $this->actingAs($this->userWithPermissions(['customers.viewAny']))
            ->patchJson("/api/v1/customers/{$customerId}", ['name' => 'Alterado'])->assertForbidden();
        $this->actingAs($this->userWithPermissions(['customers.viewAny']))
            ->deleteJson("/api/v1/customers/{$customerId}")->assertForbidden();
    }

    /** @return array{name: string, email: string, phone: string, company: string} */
    private function customerInput(): array
    {
        return ['name' => 'Acme Ltda.', 'email' => 'acme@example.test', 'phone' => '+55 88 99999-0000', 'company' => 'Acme'];
    }

    /** @param list<string> $permissions */
    private function userWithPermissions(array $permissions): User
    {
        $role = Role::query()->create(['slug' => 'customer-role-'.bin2hex(random_bytes(3)), 'name' => 'Operador']);
        $role->permissions()->sync(Permission::query()->whereIn('name', $permissions)->pluck('id'));
        $user = User::query()->create(['name' => 'Operador', 'email' => 'operator-'.bin2hex(random_bytes(3)).'@example.test']);
        $user->roles()->attach($role);

        return $user;
    }
}
