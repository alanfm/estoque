<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Http\Requests\ShowUserRequest;
use App\Core\Authorization\Http\Resources\UserResource;
use App\Models\User;

final class ShowUserController
{
    public function __invoke(ShowUserRequest $request, User $user): UserResource
    {
        return new UserResource($user->load('roles'));
    }
}
