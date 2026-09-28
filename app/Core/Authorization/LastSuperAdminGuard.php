<?php

namespace App\Core\Authorization;

use App\Core\Authorization\Exceptions\LastSuperAdminException;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class LastSuperAdminGuard
{
    public function assertCanRemoveSuperAdmin(User $user): void
    {
        if (! $user->isSuperAdmin()) {
            return;
        }

        $otherSuperAdminExists = User::query()
            ->whereKeyNot($user->getKey())
            ->whereHas('roles', fn (Builder $query) => $query->where('slug', Role::SUPER_ADMIN))
            ->exists();

        if (! $otherSuperAdminExists) {
            throw LastSuperAdminException::make();
        }
    }
}
