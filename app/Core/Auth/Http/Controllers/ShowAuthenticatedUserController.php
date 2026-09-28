<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Http\Resources\AuthenticatedUserResource;
use Illuminate\Http\Request;

final class ShowAuthenticatedUserController
{
    public function __invoke(Request $request): AuthenticatedUserResource
    {
        return new AuthenticatedUserResource($request->user()->load('roles'));
    }
}
