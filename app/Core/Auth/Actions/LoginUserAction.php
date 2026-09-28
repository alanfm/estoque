<?php

namespace App\Core\Auth\Actions;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

final class LoginUserAction
{
    public function execute(string $email, string $password, string $ip): void
    {
        $key = 'login:'.hash('sha256', mb_strtolower($email).'|'.$ip);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw new TooManyRequestsHttpException(RateLimiter::availableIn($key), 'Muitas tentativas.');
        }

        if (! Auth::guard('web')->attempt(['email' => $email, 'password' => $password])) {
            RateLimiter::hit($key, 60);

            throw ValidationException::withMessages(['email' => ['Credenciais inválidas.']]);
        }

        RateLimiter::clear($key);
    }
}
