<?php

namespace App\Core\Authorization;

use App\Models\Permission;
use Illuminate\Support\Facades\DB;

final class PermissionSynchronizer
{
    /**
     * Sincroniza o catálogo sem apagar permissões nem atribuições existentes.
     *
     * @param  array<int, array{name: string, module: string, description?: string|null}>  $definitions
     */
    public function sync(array $definitions): PermissionSyncResult
    {
        return DB::transaction(function () use ($definitions): PermissionSyncResult {
            $created = 0;
            $updated = 0;
            $restored = 0;
            $names = [];

            foreach ($definitions as $definition) {
                $names[] = $definition['name'];

                $permission = Permission::query()->where('name', $definition['name'])->first();

                if ($permission === null) {
                    Permission::query()->create([
                        'name' => $definition['name'],
                        'module' => $definition['module'],
                        'description' => $definition['description'] ?? null,
                        'obsolete_at' => null,
                    ]);
                    $created++;

                    continue;
                }

                if ($permission->isObsolete()) {
                    $restored++;
                }

                $permission->fill([
                    'module' => $definition['module'],
                    'description' => $definition['description'] ?? null,
                    'obsolete_at' => null,
                ])->save();
                $updated++;
            }

            $obsoleted = Permission::query()
                ->whereNull('obsolete_at')
                ->whereNotIn('name', $names)
                ->update(['obsolete_at' => now()]);

            return new PermissionSyncResult($created, $updated, $restored, $obsoleted);
        });
    }
}
