<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\CreateUserAction;
use App\Core\Authorization\DTOs\CreateUserData;
use App\Core\Authorization\Http\Requests\StoreUserRequest;
use App\Core\Authorization\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

final class StoreUserController
{
    public function __invoke(StoreUserRequest $request, CreateUserAction $action): JsonResponse
    {
        $user = $action->execute(CreateUserData::fromRequest($request));

        return (new UserResource($user))->response()->setStatusCode(201);
    }
}
