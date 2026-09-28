<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\LoginUserAction;
use App\Core\Auth\Http\Requests\LoginRequest;
use App\Core\Auth\Http\Resources\AuthenticatedUserResource;

final class LoginController
{
    public function __invoke(LoginRequest $request, LoginUserAction $action): AuthenticatedUserResource
    {
        $action->execute($request->validated('email'), $request->validated('password'), $request->ip());
        $request->session()->regenerate();

        return new AuthenticatedUserResource($request->user()->load('roles'));
    }
}
