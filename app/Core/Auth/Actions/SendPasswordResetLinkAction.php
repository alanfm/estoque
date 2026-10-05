<?php

namespace App\Core\Auth\Actions;

use App\Models\User;
use Illuminate\Support\Facades\Password;

final class SendPasswordResetLinkAction
{
    public function execute(string $email): void
    {
        // The HTTP response never reveals whether this address exists or is throttled by the broker.
        $user = User::query()->where('email', $email)->first();
        if ($user?->local_auth_enabled && ! $user->ldap_managed) {
            Password::broker()->sendResetLink(['email' => $email]);
        }
    }
}
