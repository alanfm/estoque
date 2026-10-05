<?php

namespace App\Core\Auth\Http\Controllers;

use Illuminate\Http\JsonResponse;

final class AuthOptionsController
{
    public function __invoke(): JsonResponse
    {
        $helpUrl = config('auth.ldap.password_help_url');
        if (! is_string($helpUrl) || ! str_starts_with($helpUrl, 'https://')) {
            $helpUrl = null;
        }

        return response()->json(['data' => [
            'localEnabled' => true,
            'ldapEnabled' => config('auth.mode') === 'ldap',
            'ldapLabel' => 'Conta institucional IFCE',
            'ldapPasswordHelpUrl' => $helpUrl,
        ]])->header('Cache-Control', 'no-store');
    }
}
