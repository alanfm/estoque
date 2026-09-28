<?php

namespace App\Core\Authorization\Actions;

use App\Core\Authorization\Exceptions\ProtectedRoleException;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class DeleteRoleAction
{
    public function execute(Role $role): void
    {
        if ($role->isSuperAdmin()) {
            throw ProtectedRoleException::make();
        }

        if ($role->users()->exists()) {
            throw new ConflictHttpException('O papel ainda está atribuído a usuários.');
        }

        DB::transaction(function () use ($role): void {
            $role->permissions()->detach();
            $role->delete();
        });
    }
}
