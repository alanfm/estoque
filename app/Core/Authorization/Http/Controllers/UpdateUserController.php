<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\UpdateUserAction;
use App\Core\Authorization\DTOs\UpdateUserData;
use App\Core\Authorization\Http\Requests\UpdateUserRequest;
use App\Core\Authorization\Http\Resources\UserResource;
use App\Models\User;

final class UpdateUserController
{
    public function __invoke(UpdateUserRequest $request, User $user, UpdateUserAction $action): UserResource
    {
        return new UserResource($action->execute($user, UpdateUserData::fromRequest($request)));
    }
}
