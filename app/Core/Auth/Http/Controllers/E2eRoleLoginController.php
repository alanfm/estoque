<?php

namespace App\Core\Auth\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class E2eRoleLoginController
{
    private const ROLES = [
        'almoxarife' => ['inventory.entries.create', 'inventory.issues.create', 'inventory.items.viewAny', 'inventory.items.view', 'inventory.categories.viewAny', 'inventory.movements.viewAny', 'inventory.movements.view', 'inventory.dashboard.view', 'inventory.reports.view'],
        'gestor' => ['inventory.items.viewAny', 'inventory.items.view', 'inventory.categories.viewAny', 'inventory.movements.viewAny', 'inventory.movements.view', 'inventory.dashboard.view', 'inventory.reports.view', 'inventory.entries.create', 'inventory.issues.create', 'inventory.categories.create', 'inventory.categories.update', 'inventory.items.create', 'inventory.items.update', 'inventory.variants.create', 'inventory.variants.update', 'inventory.adjustments.create', 'inventory.movements.reverse', 'inventory.movements.manageDrafts'],
        'auditor' => ['inventory.items.viewAny', 'inventory.items.view', 'inventory.categories.viewAny', 'inventory.movements.viewAny', 'inventory.movements.view', 'inventory.dashboard.view', 'inventory.reports.view'],
        'administrador-operacional' => ['inventory.items.viewAny', 'inventory.items.view', 'inventory.categories.viewAny', 'inventory.movements.viewAny', 'inventory.movements.view', 'inventory.dashboard.view', 'inventory.reports.view', 'inventory.entries.create', 'inventory.issues.create', 'inventory.items.configureReplenishment', 'inventory.imports.view', 'inventory.imports.execute'],
    ];

    public function __invoke(Request $request, string $role)
    {
        abort_unless(
            app()->environment('testing') ||
            (app()->environment('local') && config('app.e2e_role_actors')),
            404,
        );
        abort_unless(isset(self::ROLES[$role]), 404);
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $permissions = self::ROLES[$role];
        $email = 'e2e-'.$role.'@example.test';
        $name = 'E2E '.str_replace('-', ' ', $role);
        $password = bin2hex(random_bytes(24));

        $user = DB::transaction(function () use ($email, $name, $password, $role, $permissions): User {
            $permissionIds = Permission::query()->whereIn('name', $permissions)->whereNull('obsolete_at')->pluck('id');
            abort_unless($permissionIds->count() === count($permissions), 500, 'E2E permission catalog is incomplete.');
            $rolePermissions = $role === 'almoxarife' ? ['inventory.items.viewAny', 'inventory.items.view', 'inventory.categories.viewAny', 'inventory.movements.viewAny', 'inventory.movements.view', 'inventory.dashboard.view', 'inventory.reports.view', ...$permissions] : $permissions;
            $rolePermissionIds = Permission::query()->whereIn('name', $rolePermissions)->whereNull('obsolete_at')->pluck('id');

            $roleModel = Role::query()->firstOrCreate(['slug' => 'e2e-'.$role], ['name' => $name]);
            $roleModel->permissions()->sync($rolePermissionIds);

            $user = User::query()->firstOrNew(['email' => $email]);
            $user->name = $name;
            $user->password = Hash::make($password);
            $user->save();
            $user->roles()->sync([$roleModel->id]);

            return $user;
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json(['data' => ['email' => $email, 'password' => $password]])
            ->header('Cache-Control', 'no-store');
    }
}
