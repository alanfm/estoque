<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\ResetUserPasswordAction;
use App\Core\Auth\Http\Requests\ResetPasswordRequest;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class ResetPasswordController
{
    public function __invoke(ResetPasswordRequest $request, ResetUserPasswordAction $action): Response
    {
        $action->execute($request->validated('email'), $request->validated('token'), $request->validated('password'));
        Auth::guard('web')->logout();
        Auth::forgetGuards();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
