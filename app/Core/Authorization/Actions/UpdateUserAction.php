<?php

namespace App\Core\Authorization\Actions;

use App\Core\Auth\Actions\SendPasswordResetLinkAction;
use App\Core\Authorization\DTOs\UpdateUserData;
use App\Core\Authorization\LastSuperAdminGuard;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

final class UpdateUserAction
{
    public function __construct(private readonly LastSuperAdminGuard $guard) {}

    public function execute(User $user, UpdateUserData $data): User
    {
        if ($user->ldap_managed) {
            $changes = [
                'name' => $data->name !== null && $data->name !== $user->name,
                'email' => $data->email !== null && mb_strtolower($data->email) !== $user->email,
                'registry' => $data->registryProvided && $data->registry !== $user->registry,
                'ldapEnabled' => $data->ldapEnabled !== null && $data->ldapEnabled !== $user->ldap_enabled,
                'localAuthEnabled' => $data->localAuthEnabled !== null && $data->localAuthEnabled !== $user->local_auth_enabled,
            ];
            $errors = [];
            foreach ($changes as $field => $changed) {
                if ($changed) {
                    $errors[$field] = ['Este dado é administrado pelo LDAP.'];
                }
            }
            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }
        }

        $reactivatedLocal = $data->localAuthEnabled === true && ! $user->local_auth_enabled;
        $disablingLocal = $data->localAuthEnabled === false && $user->local_auth_enabled;
        $emailChanged = $data->email !== null && mb_strtolower($data->email) !== $user->email;
        $authSettingsChanged = $data->registryProvided || $data->ldapEnabled !== null || $data->localAuthEnabled !== null;
        DB::transaction(function () use ($user, $data, $emailChanged, $disablingLocal): void {
            if ($data->name !== null) {
                $user->name = $data->name;
            }

            if ($data->email !== null) {
                $user->email = mb_strtolower($data->email);
            }

            $wasLocalAdmin = $user->isSuperAdmin() && $user->local_auth_enabled && $user->password !== null;
            if ($data->registryProvided) {
                $user->registry = $data->registry;
            }
            if ($data->ldapEnabled !== null) {
                $user->ldap_enabled = $data->ldapEnabled;
            }
            if ($data->localAuthEnabled !== null) {
                $user->local_auth_enabled = $data->localAuthEnabled;
            }

            if ($disablingLocal) {
                $user->password = null;
                Password::broker()->deleteToken($user);
            }
            if ($emailChanged) {
                Password::broker()->deleteToken($user);
            }

            if ($disablingLocal) {
                $this->guard->assertCanRemoveSuperAdmin($user, $wasLocalAdmin);
            }

            $user->save();

            if ($data->roles === null) {
                return;
            }

            $willLoseSuperAdmin = $user->isSuperAdmin()
                && ! in_array(Role::SUPER_ADMIN, $data->roles, true);

            if ($willLoseSuperAdmin) {
                $this->guard->assertCanRemoveSuperAdmin($user);
            }

            $user->roles()->sync(
                Role::query()
                    ->whereIn('slug', $data->roles)
                    ->pluck('id')
                    ->map(static fn ($id): int => (int) $id)
                    ->all(),
            );
        });

        if ($reactivatedLocal || ($emailChanged && $user->local_auth_enabled && $user->password === null)) {
            app(SendPasswordResetLinkAction::class)->execute($user->email);
        }
        if ($authSettingsChanged) {
            DB::table('sessions')->where('user_id', $user->getKey())->delete();
            Log::info('Origens de autenticação atualizadas.', ['userId' => $user->getKey(), 'registryChanged' => $data->registryProvided, 'ldapEnabled' => $user->ldap_enabled, 'localAuthEnabled' => $user->local_auth_enabled, 'requestId' => request()->attributes->get('requestId')]);
        }

        return $user->load('roles');
    }
}
