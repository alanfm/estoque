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
        $result = Password::broker()->reset(
            compact('email', 'token', 'password'),
            function (User $user, string $newPassword): void {
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
