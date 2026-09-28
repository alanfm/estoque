<?php

namespace App\Core\Auth\Http\Controllers;

use App\Core\Auth\Actions\SendPasswordResetLinkAction;
use App\Core\Auth\Http\Requests\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;

final class ForgotPasswordController
{
    public function __invoke(ForgotPasswordRequest $request, SendPasswordResetLinkAction $action): JsonResponse
    {
        $action->execute($request->validated('email'));

        return response()->json(['message' => 'Se existir uma conta, enviaremos as instruções por e-mail.'], 202);
    }
}
