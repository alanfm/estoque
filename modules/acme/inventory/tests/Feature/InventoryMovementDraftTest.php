<?php

namespace Acme\Inventory\Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class InventoryMovementDraftTest extends TestCase
{
    use RefreshDatabase;

    public function test_issue_draft_requires_explanation_without_order_and_is_owned_by_creator(): void
    {
        $this->artisan('core:sync-permissions')->assertSuccessful();
        $this->artisan('inventory:install')->assertSuccessful();
        [$user, $variant] = $this->fixture();
        $location = (int) DB::table('inventory_locations')->where('code', 'TI')->value('id');
        $this->actingAs($user)->withHeader('Idempotency-Key', 'incomplete-draft')->postJson('/api/v1/inventory/movements', [
            'type' => 'ISSUE', 'locationId' => $location, 'description' => 'Atendimento de rede',
            'lines' => [['variantId' => $variant, 'quantity' => 2]],
        ])->assertCreated()->assertJsonPath('data.status', 'DRAFT')->assertJsonPath('data.observations', null);

        $draft = $this->withHeader('Idempotency-Key', 'create-issue-draft')->postJson('/api/v1/inventory/movements', [
            'type' => 'ISSUE', 'locationId' => $location, 'description' => 'Atendimento de rede', 'observations' => 'Sem OS no chamado',
            'lines' => [['variantId' => $variant, 'quantity' => 2]],
        ])->assertCreated()->assertJsonPath('data.status', 'DRAFT')->assertJsonPath('data.lines.0.quantity', 2);
        $movementId = $draft->json('data.id');
        $retry = $this->withHeader('Idempotency-Key', 'create-issue-draft')->postJson('/api/v1/inventory/movements', [
            'type' => 'ISSUE', 'locationId' => $location, 'description' => 'Atendimento de rede', 'observations' => 'Sem OS no chamado',
            'lines' => [['variantId' => $variant, 'quantity' => 2]],
        ])->assertCreated();
        self::assertSame($movementId, $retry->json('data.id'));
        $this->assertDatabaseCount('inventory_movements', 2);

        $otherUser = $this->userWithPermission('inventory.issues.create');
        $this->actingAs($otherUser)->postJson("/api/v1/inventory/movements/{$movementId}/cancel")->assertForbidden();
        $this->actingAs($user)->postJson("/api/v1/inventory/movements/{$movementId}/cancel")->assertOk()->assertJsonPath('data.status', 'CANCELLED');
        self::assertDatabaseCount('inventory_ledger_entries', 0);
    }

    /** @return array{User, int} */
    private function fixture(): array
    {
        $user = $this->userWithPermission('inventory.issues.create');
        $category = DB::table('inventory_categories')->insertGetId(['name' => 'Draft', 'normalized_name' => 'draft', 'active' => true, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $item = DB::table('inventory_items')->insertGetId(['code' => 'DRF01', 'category_id' => $category, 'name' => 'Item draft', 'unit' => 'UN', 'active' => true, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);
        $variant = DB::table('inventory_product_variants')->insertGetId(['item_id' => $item, 'description' => 'Variante', 'identity_hash' => hash('sha256', 'draft'), 'active' => true, 'version' => 1, 'created_at' => now(), 'updated_at' => now()]);

        return [$user, $variant];
    }

    private function userWithPermission(string $permission): User
    {
        $role = Role::query()->create(['slug' => 'draft-'.bin2hex(random_bytes(3)), 'name' => 'Draft']);
        $role->permissions()->sync(Permission::query()->where('name', $permission)->pluck('id'));
        $user = User::query()->create(['name' => 'Operador', 'email' => 'draft-'.bin2hex(random_bytes(4)).'@example.test']);
        $user->roles()->attach($role);

        return $user;
    }
}
