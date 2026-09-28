<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('auth-ip', fn (Request $request) => Limit::perMinute(5)
            ->by(($request->route()?->getName() ?? 'auth').'|'.$request->ip()));

        ResetPassword::createUrlUsing(fn ($user, string $token): string => url('/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ])));
    }
}
