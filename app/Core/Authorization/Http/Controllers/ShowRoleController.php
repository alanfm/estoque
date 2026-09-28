<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Http\Requests\ShowRoleRequest;
use App\Core\Authorization\Http\Resources\RoleResource;
use App\Models\Role;

final class ShowRoleController
{
    public function __invoke(ShowRoleRequest $request, Role $role): RoleResource
    {
        return new RoleResource($role->load('permissions')->loadCount('users'));
    }
}
