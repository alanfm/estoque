<?php

namespace App\Core\Authorization\Actions;

use App\Core\Authorization\LastSuperAdminGuard;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class DeleteUserAction
{
    public function __construct(private readonly LastSuperAdminGuard $guard) {}

    public function execute(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->guard->assertCanRemoveSuperAdmin($user);
            $user->delete();
        });
    }
}
