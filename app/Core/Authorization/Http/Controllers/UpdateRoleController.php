<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\UpdateRoleAction;
use App\Core\Authorization\DTOs\UpdateRoleData;
use App\Core\Authorization\Http\Requests\UpdateRoleRequest;
use App\Core\Authorization\Http\Resources\RoleResource;
use App\Models\Role;

final class UpdateRoleController
{
    public function __invoke(UpdateRoleRequest $request, Role $role, UpdateRoleAction $action): RoleResource
    {
        return new RoleResource($action->execute($role, UpdateRoleData::fromRequest($request)));
    }
}
