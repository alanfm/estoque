<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\SyncLdapProfileAction;
use App\Core\Auth\Http\Requests\SyncLdapProfileRequest;
use App\Core\Auth\Http\Resources\AuthenticatedUserResource;

final class SyncLdapProfileController
{
    public function __invoke(SyncLdapProfileRequest $request, SyncLdapProfileAction $action): AuthenticatedUserResource
    {
        return new AuthenticatedUserResource($action->execute($request->user(), $request->validated('password'))->load('roles'));
    }
}
