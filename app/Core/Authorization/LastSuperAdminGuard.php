<?php

namespace App\Core\Authorization;

use App\Core\Authorization\Exceptions\LastSuperAdminException;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class LastSuperAdminGuard
{
    public function assertCanRemoveSuperAdmin(User $user, bool $wasLocalAdmin = false): void
    {
        if (! $user->isSuperAdmin() || (! $wasLocalAdmin && (! $user->local_auth_enabled || $user->password === null))) {
            return;
        }

        $otherSuperAdminExists = User::query()
            ->whereKeyNot($user->getKey())
            ->where('local_auth_enabled', true)
            ->whereNotNull('password')
            ->whereHas('roles', fn (Builder $query) => $query->where('slug', Role::SUPER_ADMIN))
            ->exists();

        if (! $otherSuperAdminExists) {
            throw LastSuperAdminException::make();
        }
    }
}
