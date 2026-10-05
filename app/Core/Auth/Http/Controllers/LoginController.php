<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\LoginUserAction;
use App\Core\Auth\Http\Requests\LoginRequest;
use App\Core\Auth\Http\Resources\AuthenticatedUserResource;
use Illuminate\Http\JsonResponse;

final class LoginController
{
    public function __invoke(LoginRequest $request, LoginUserAction $action): JsonResponse
    {
        $provider = $action->execute($request->validated('provider'), $request->validated('registry'), $request->validated('password'), $request->ip());
        $request->session()->regenerate();
        $request->session()->put('auth_provider', $provider);

        return (new AuthenticatedUserResource($request->user()->load('roles')))->response()->setStatusCode(200);
    }
}
