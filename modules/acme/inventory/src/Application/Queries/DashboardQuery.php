<?php

namespace Acme\Inventory\Application\Queries;

use Illuminate\Support\Facades\DB;

final class DashboardQuery
{
    /** @return array<string, mixed> */
    public function execute(?string $from = null, ?string $to = null): array
    {
        return DB::transaction(function () use ($from, $to): array {
            $today = now(config('app.timezone'))->toDateString();
            $from ??= now(config('app.timezone'))->startOfMonth()->toDateString();
            $to ??= $today;
            $items = DB::table('inventory_items as i')->leftJoin('inventory_categories as c', 'c.id', '=', 'i.category_id')
                ->leftJoin('inventory_product_variants as v', 'v.item_id', '=', 'i.id')
                ->leftJoin('inventory_balances as b', 'b.variant_id', '=', 'v.id')
                ->groupBy('i.id', 'i.code', 'i.name', 'i.unit', 'i.minimum_stock', 'i.active')
                ->get(['i.id', 'i.code', 'i.name', 'i.unit', 'i.minimum_stock', 'i.active', DB::raw('COALESCE(SUM(b.quantity), 0) as stock'), DB::raw('SUM(CASE WHEN b.quantity < 0 THEN 1 ELSE 0 END) as negative_variants')]);

            $active = $items->where('active', true);
            $movementBase = DB::table('inventory_ledger_entries as l')->join('inventory_movement_lines as ml', 'ml.id', '=', 'l.movement_line_id')
                ->join('inventory_movements as m', 'm.id', '=', 'ml.movement_id')->where('m.status', 'POSTED')
                ->whereBetween('l.effective_on', [$from, $to]);

            return [
                'asOf' => now()->toIso8601String(), 'period' => ['from' => $from, 'to' => $to],
                'activeItems' => $active->count(),
                'inconsistentItems' => $active->filter(static fn ($row): bool => (int) $row->negative_variants > 0)->count(),
                'outOfStockItems' => $active->filter(static fn ($row): bool => (int) $row->stock === 0)->count(),
                'itemsWithoutMinimum' => $active->filter(static fn ($row): bool => $row->stock > 0 && $row->minimum_stock === null)->count(),
                'replenishmentAlerts' => $active->filter(static fn ($row): bool => $row->stock > 0 && $row->minimum_stock !== null && $row->stock <= $row->minimum_stock)->count(),
                'entryUnits' => (int) (clone $movementBase)->where('m.type', 'ENTRY')->where('l.delta', '>', 0)->sum('l.delta'),
                'issueUnits' => (int) abs((clone $movementBase)->where('m.type', 'ISSUE')->where('l.delta', '<', 0)->sum('l.delta')),
            ];
        });
    }
}
