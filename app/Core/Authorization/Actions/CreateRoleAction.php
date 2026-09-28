<?php

namespace App\Core\Authorization\Actions;

use App\Core\Authorization\DTOs\CreateRoleData;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

final class CreateRoleAction
{
    public function execute(CreateRoleData $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            $role = Role::query()->create([
                'slug' => $data->slug,
                'name' => $data->name,
            ]);

            $role->permissions()->sync($this->permissionIds($data->permissions));

            return $role->load('permissions');
        });
    }

    /**
     * @param  array<int, string>  $names
     * @return array<int, int>
     */
    private function permissionIds(array $names): array
    {
        return Permission::query()
            ->whereIn('name', $names)
            ->whereNull('obsolete_at')
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }
}
