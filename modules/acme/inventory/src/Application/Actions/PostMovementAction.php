<?php

namespace Acme\Inventory\Application\Actions;

use Acme\Inventory\Domain\Exceptions\InsufficientStock;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PostMovementAction
{
    /** @return array<string, int|string> */
    public function execute(int $movementId, int $actorId, int $expectedVersion, string $idempotencyKey): array
    {
        return app(ExecuteIdempotentOperation::class)->execute(
            $actorId, 'movement.post', (string) $movementId, $idempotencyKey,
            ['movementId' => $movementId, 'version' => $expectedVersion],
            fn (): array => $this->post($movementId, $actorId, $expectedVersion),
        );
    }

    /** @return array<string, int|string> */
    private function post(int $movementId, int $actorId, int $expectedVersion): array
    {
        return DB::transaction(function () use ($movementId, $actorId, $expectedVersion): array {
            $movement = DB::table('inventory_movements')->where('id', $movementId)->lockForUpdate()->first();
            abort_if($movement === null, 404);
            abort_unless($movement->status === 'DRAFT' && (int) $movement->version === $expectedVersion, 409, 'VERSION_CONFLICT');
            $lines = DB::table('inventory_movement_lines')->where('movement_id', $movementId)->orderBy('variant_id')->get();
            if ($lines->isEmpty()) {
                throw ValidationException::withMessages(['lines' => 'O movimento precisa conter ao menos uma linha.']);
            }

            $variantIds = $lines->pluck('variant_id')->map(fn ($id): int => (int) $id)->all();
            $variants = DB::table('inventory_product_variants')->whereIn('id', $variantIds)->orderBy('item_id')->orderBy('id')->get();
            $itemIds = $variants->pluck('item_id')->unique()->sort()->values()->all();
            DB::table('inventory_items')->whereIn('id', $itemIds)->orderBy('id')->lockForUpdate()->get();
            foreach ($variantIds as $variantId) {
                DB::table('inventory_balances')->insertOrIgnore(['location_id' => $movement->location_id, 'variant_id' => $variantId, 'quantity' => 0, 'version' => 1]);
            }
            $balances = DB::table('inventory_balances')->where('location_id', $movement->location_id)->whereIn('variant_id', $variantIds)->orderBy('id')->lockForUpdate()->get()->keyBy('variant_id');
            $postedAt = now();

            foreach ($lines as $line) {
                $variant = $variants->firstWhere('id', $line->variant_id);
                $balance = $balances->get($line->variant_id);
                abort_unless($variant !== null && $balance !== null, 409, 'BALANCE_UNAVAILABLE');
                abort_unless((bool) $variant->active, 422, 'INACTIVE_VARIANT');
                $quantity = (int) $line->quantity;
                if ($quantity < 1) {
                    throw ValidationException::withMessages(['lines' => 'Quantidade deve ser maior que zero.']);
                }
                $delta = match ($movement->type) {
                    'ENTRY' => $quantity,
                    'ISSUE' => -$quantity,
                    default => throw ValidationException::withMessages(['type' => 'Tipo de movimento não permitido nesta operação.']),
                };
                if ((int) $balance->quantity + $delta < 0) {
                    throw new InsufficientStock((int) $line->variant_id, (int) $balance->quantity, $quantity);
                }
                DB::table('inventory_ledger_entries')->insert(['movement_line_id' => $line->id, 'variant_id' => $line->variant_id, 'location_id' => $movement->location_id, 'effective_on' => $movement->occurred_on, 'delta' => $delta, 'posted_at' => $postedAt]);
                DB::table('inventory_balances')->where('id', $balance->id)->update(['quantity' => (int) $balance->quantity + $delta, 'version' => (int) $balance->version + 1, 'updated_at' => $postedAt]);
            }

            DB::table('inventory_movements')->where('id', $movementId)->update(['status' => 'POSTED', 'posted_by' => $actorId, 'posted_at' => $postedAt, 'version' => $expectedVersion + 1, 'updated_at' => $postedAt]);
            DB::table('inventory_audit_events')->insert(['entity_type' => 'movement', 'entity_id' => $movementId, 'action' => 'posted', 'actor_id' => $actorId, 'before' => json_encode(['status' => 'DRAFT']), 'after' => json_encode(['status' => 'POSTED']), 'occurred_at' => $postedAt]);

            return ['movementId' => $movementId, 'status' => 'POSTED', 'version' => $expectedVersion + 1];
        }, 3);
    }
}
