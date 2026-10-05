<?php

namespace App\Core\Auth\Actions;

use App\Core\Auth\Ldap\LdapAuthenticator;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class SyncLdapProfileAction
{
    public function execute(User $user, string $password): User
    {
        if (! $user->ldap_managed || ! $user->ldap_enabled || config('auth.mode') !== 'ldap') {
            throw new HttpException(403, 'Sincronização institucional indisponível.');
        }
        $registry = $user->registry;
        $profile = app(LdapAuthenticator::class)->authenticateProfile($registry, $password);
        if ($profile === null || $profile->objectId !== $user->ldap_object_id) {
            throw ValidationException::withMessages(['password' => ['Não foi possível validar a conta institucional.']]);
        }

        try {
            $updated = DB::transaction(function () use ($user, $registry, $profile): User {
                $current = User::query()->lockForUpdate()->findOrFail($user->getKey());
                if (! $current->ldap_managed || ! $current->ldap_enabled || $current->registry !== $registry || $current->ldap_object_id !== $profile->objectId) {
                    throw new ConflictHttpException('A conta foi alterada. Entre novamente.');
                }
                $current->name = $profile->name;
                $current->email = $profile->email;
                $current->ldap_synced_at = now();
                $current->save();

                return $current;
            });
        } catch (UniqueConstraintViolationException $exception) {
            throw new ConflictHttpException('Não foi possível sincronizar a conta institucional.', $exception);
        }
        Log::info('Perfil institucional sincronizado.', ['userId' => $user->getKey(), 'requestId' => request()->attributes->get('requestId')]);

        return $updated;
    }
}
