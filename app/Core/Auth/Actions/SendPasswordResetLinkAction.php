<?php

namespace App\Core\Auth\Actions;

use Illuminate\Support\Facades\Password;

final class SendPasswordResetLinkAction
{
    public function execute(string $email): void
    {
        // The HTTP response never reveals whether this address exists or is throttled by the broker.
        Password::broker()->sendResetLink(['email' => $email]);
    }
}
