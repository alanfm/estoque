<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\ChangeUserPasswordAction;
use App\Core\Auth\Http\Requests\ChangePasswordRequest;
use Symfony\Component\HttpFoundation\Response;

final class ChangePasswordController
{
    public function __invoke(ChangePasswordRequest $request, ChangeUserPasswordAction $action): Response
    {
        $action->execute(
            $request->user(),
            $request->validated('currentPassword'),
            $request->validated('password'),
            $request->session()->getId(),
        );

        return response()->noContent();
    }
}
