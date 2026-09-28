<?php

namespace App\Core\Authorization\Actions;

use App\Core\Authorization\DTOs\UpdateUserData;
use App\Core\Authorization\LastSuperAdminGuard;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class UpdateUserAction
{
    public function __construct(private readonly LastSuperAdminGuard $guard) {}

    public function execute(User $user, UpdateUserData $data): User
    {
        DB::transaction(function () use ($user, $data): void {
            if ($data->name !== null) {
                $user->name = $data->name;
            }

            if ($data->email !== null) {
                $user->email = mb_strtolower($data->email);
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

        return $user->load('roles');
    }
}
