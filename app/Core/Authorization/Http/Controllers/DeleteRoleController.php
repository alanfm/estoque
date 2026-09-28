<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\DeleteRoleAction;
use App\Core\Authorization\Http\Requests\DeleteRoleRequest;
use App\Models\Role;
use Symfony\Component\HttpFoundation\Response;

final class DeleteRoleController
{
    public function __invoke(DeleteRoleRequest $request, Role $role, DeleteRoleAction $action): Response
    {
        $action->execute($role);

        return response()->noContent();
    }
}
