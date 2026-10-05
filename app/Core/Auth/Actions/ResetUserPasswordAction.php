<?php

namespace App\Core\Auth\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

final class ResetUserPasswordAction
{
    public function execute(string $email, string $token, string $password): void
    {
        $user = User::query()->where('email', $email)->first();
        if (! $user?->local_auth_enabled || $user->ldap_managed) {
            throw ValidationException::withMessages(['token' => ['Link inválido ou expirado.']]);
        }
        $result = Password::broker()->reset(
            compact('email', 'token', 'password'),
            function (User $user, string $newPassword): void {
                if ($user->ldap_managed || ! $user->local_auth_enabled) {
                    throw ValidationException::withMessages(['token' => ['Link inválido ou expirado.']]);
                }
                DB::transaction(function () use ($user, $newPassword): void {
                    $user->password = Hash::make($newPassword);
                    $user->save();
                    DB::table('sessions')->where('user_id', $user->getKey())->delete();
                });
            },
        );

        if ($result !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => ['Link inválido ou expirado.']]);
        }
    }
}
