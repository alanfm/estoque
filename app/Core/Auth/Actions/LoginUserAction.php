<?php

namespace App\Core\Auth\Actions;

use App\Core\Auth\Exceptions\LdapUnavailableException;
use App\Core\Auth\Ldap\LdapAuthenticator;
use App\Core\Auth\Ldap\Registry;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

final class LoginUserAction
{
    public function execute(string $provider, string $registry, string $password, string $ip): string
    {
        $registry = Registry::normalize($registry);
        $identifier = $registry;
        $key = 'login:'.hash('sha256', $identifier.'|'.$ip);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw new TooManyRequestsHttpException(RateLimiter::availableIn($key), 'Muitas tentativas.');
        }

        RateLimiter::hit($key, 60);
        $user = User::query()->where('registry', $registry)->first();
        if ($provider === 'auto') {
            $provider = $user === null
                ? (config('auth.mode') === 'ldap' ? 'ldap' : 'local')
                : ($user->ldap_managed || $user->ldap_enabled ? 'ldap' : 'local');
        }

        $source = null;
        if ($provider === 'local') {
            if ($this->canUseLocalPassword($user, $password)) {
                $source = 'local';
            }
        } else {
            if (config('auth.mode') !== 'ldap') {
                throw ValidationException::withMessages(['provider' => ['Login institucional indisponível.']]);
            }
            $ldap = app(LdapAuthenticator::class);
            if ($ldap->circuitOpen()) {
                if ($user?->ldap_enabled && $this->canUseLocalPassword($user, $password)) {
                    $source = 'local';
                } else {
                    throw new LdapUnavailableException;
                }
            } elseif ($user === null || $user->ldap_enabled) {
                try {
                    if ($user === null || $user->ldap_managed) {
                        $profile = $ldap->authenticateProfile($registry, $password);
                        if ($profile !== null) {
                            if ($user === null) {
                                $user = app(ProvisionLdapUserAction::class)->execute($registry, $profile);
                                $source = 'ldap';
                            } elseif ($user->ldap_object_id === $profile->objectId) {
                                $source = 'ldap';
                            }
                        }
                    } elseif ($ldap->authenticate($registry, $password)) {
                        $source = 'ldap';
                    } elseif ($this->canUseLocalPassword($user, $password)) {
                        $source = 'local';
                    }
                } catch (LdapUnavailableException $exception) {
                    if ($this->canUseLocalPassword($user, $password)) {
                        $source = 'local';
                    } else {
                        throw $exception;
                    }
                }
            }
        }

        if ($source === null || $user === null) {
            Log::notice('Autenticação recusada.', ['provider' => $provider, 'identifierHash' => hash_hmac('sha256', $identifier, (string) config('app.key')), 'requestId' => request()->attributes->get('requestId')]);

            throw ValidationException::withMessages(['registry' => ['Credenciais inválidas.']]);
        }

        Auth::guard('web')->login($user);
        RateLimiter::clear($key);
        Log::info('Autenticação concluída.', ['providerRequested' => $provider, 'providerUsed' => $source, 'userId' => $user->getKey(), 'requestId' => request()->attributes->get('requestId')]);

        return $source;
    }

    private function canUseLocalPassword(?User $user, string $password): bool
    {
        return $user !== null && ! $user->ldap_managed && $user->local_auth_enabled
            && $user->password !== null && Hash::check($password, $user->password);
    }
}
