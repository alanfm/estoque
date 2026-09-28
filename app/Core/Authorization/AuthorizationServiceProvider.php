<?php

namespace App\Core\Authorization;

use App\Core\Authorization\Policies\PermissionPolicy;
use App\Core\Authorization\Policies\RolePolicy;
use App\Core\Authorization\Policies\UserPolicy;
use App\Core\Modules\ModuleRegistry;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

final class AuthorizationServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::before(fn (?User $user): ?bool => $user?->isSuperAdmin() === true ? true : null);

        $permissions = [
            ...CorePermissions::names(),
            ...$this->app->make(ModuleRegistry::class)->permissionNames(),
        ];

        foreach (array_unique($permissions) as $permission) {
            Gate::define($permission, fn (?User $user): bool => $user !== null && $user->hasPermission($permission));
        }

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Permission::class, PermissionPolicy::class);
    }
}
