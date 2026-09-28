<?php

namespace App\Core\Auth\Actions;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class ChangeUserPasswordAction
{
    public function execute(User $user, string $currentPassword, string $newPassword, string $sessionId): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages(['currentPassword' => ['Senha atual inválida.']]);
        }

        DB::transaction(function () use ($user, $newPassword, $sessionId): void {
            $user->password = Hash::make($newPassword);
            $user->save();
            DB::table('sessions')->where('user_id', $user->getKey())->where('id', '!=', $sessionId)->delete();
        });
    }
}
