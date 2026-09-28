<?php

namespace App\Core\Authorization\Policies;

use App\Models\User;

final class PermissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('permissions.viewAny');
    }
}
