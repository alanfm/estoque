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
        if (! in_array(config('auth.mode'), ['local', 'ldap'], true)) {
            throw new \LogicException('AUTH_MODE deve ser local ou ldap.');
        }
        if (config('auth.mode') === 'ldap' && app()->environment('production')) {
            if (config('auth.ldap.ssl') && config('auth.ldap.tls')) {
                throw new \LogicException('LDAP não permite SSL e StartTLS simultaneamente.');
            }
            if (! extension_loaded('ldap')) {
                throw new \LogicException('A extensão PHP LDAP é obrigatória para AUTH_MODE=ldap.');
            }
        }
        RateLimiter::for('auth-ip', fn (Request $request) => Limit::perMinute(5)
            ->by(($request->route()?->getName() ?? 'auth').'|'.$request->ip()));

        ResetPassword::createUrlUsing(fn ($user, string $token): string => url('/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $user->getEmailForPasswordReset(),
        ])));

    }
}
