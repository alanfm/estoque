<?php

namespace App\Core\Authorization\Actions;

use App\Core\Authorization\DTOs\UpdateRoleData;
use App\Core\Authorization\Exceptions\ProtectedRoleException;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

final class UpdateRoleAction
{
    public function execute(Role $role, UpdateRoleData $data): Role
    {
        if ($role->isSuperAdmin()) {
            throw ProtectedRoleException::make();
        }

        return DB::transaction(function () use ($role, $data): Role {
            if ($data->name !== null) {
                $role->name = $data->name;
                $role->save();
            }

            if ($data->permissions !== null) {
                $role->permissions()->sync(
                    Permission::query()
                        ->whereIn('name', $data->permissions)
                        ->whereNull('obsolete_at')
                        ->pluck('id')
                        ->map(static fn ($id): int => (int) $id)
                        ->all(),
                );
            }

            return $role->load('permissions')->loadCount('users');
        });
    }
}
