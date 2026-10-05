<?php

namespace App\Core\Auth\Actions;

use App\Core\Auth\Ldap\LdapProfile;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ProvisionLdapUserAction
{
    public function execute(string $registry, LdapProfile $profile): User
    {
        try {
            return DB::transaction(function () use ($registry, $profile): User {
                $user = new User([
                    'name' => $profile->name,
                    'email' => $profile->email,
                    'registry' => $registry,
                    'ldap_enabled' => true,
                    'local_auth_enabled' => false,
                ]);
                $user->password = null;
                $user->ldap_managed = true;
                $user->ldap_object_id = $profile->objectId;
                $user->ldap_synced_at = now();
                $user->save();

                return $user;
            });
        } catch (UniqueConstraintViolationException $exception) {
            // A concurrent login may have provisioned exactly the same identity.
            $user = User::query()->where('registry', $registry)->first();
            if ($user?->ldap_managed && $user->ldap_enabled && $user->ldap_object_id === $profile->objectId) {
                return $user;
            }

            // Never merge a local account by matching email or another registry.
            throw new ConflictHttpException('Não foi possível vincular a conta institucional.', $exception);
        }
    }
}
