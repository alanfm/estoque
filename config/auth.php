<?php

use App\Models\User;

return [
    'mode' => env('AUTH_MODE', 'local'),
    'ldap' => [
        'host' => env('LDAP_DEFAULT_HOSTS', 'ad.ifce.edu.br'),
        'port' => (int) env('LDAP_DEFAULT_PORT', 636),
        'upn_suffix' => env('LDAP_UPN_SUFFIX', 'ad.ifce.edu.br'),
        'base_dn' => env('LDAP_DEFAULT_BASE_DN'),
        'timeout' => min(10, max(1, (int) env('LDAP_DEFAULT_TIMEOUT', 5))),
        'ssl' => (bool) env('LDAP_DEFAULT_SSL', true),
        'tls' => (bool) env('LDAP_DEFAULT_TLS', false),
        'username' => env('LDAP_DEFAULT_USERNAME'),
        'password' => env('LDAP_DEFAULT_PASSWORD'),
        'password_help_url' => env('LDAP_PASSWORD_HELP_URL'),
    ],
    'defaults' => ['guard' => 'web', 'passwords' => 'users'],
    'guards' => ['web' => ['driver' => 'session', 'provider' => 'users']],
    'providers' => ['users' => ['driver' => 'eloquent', 'model' => User::class]],
    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],
    'password_timeout' => 10800,
];
