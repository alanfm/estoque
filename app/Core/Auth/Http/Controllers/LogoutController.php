<?php

namespace App\Core\Auth\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

final class LogoutController
{
    public function __invoke(Request $request): Response
    {
        Auth::guard('web')->logout();
        Auth::forgetGuards();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }
}
