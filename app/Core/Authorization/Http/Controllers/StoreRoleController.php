<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\CreateRoleAction;
use App\Core\Authorization\DTOs\CreateRoleData;
use App\Core\Authorization\Http\Requests\StoreRoleRequest;
use App\Core\Authorization\Http\Resources\RoleResource;
use Illuminate\Http\JsonResponse;

final class StoreRoleController
{
    public function __invoke(StoreRoleRequest $request, CreateRoleAction $action): JsonResponse
    {
        $role = $action->execute(CreateRoleData::fromRequest($request));

        return (new RoleResource($role))->response()->setStatusCode(201);
    }
}
