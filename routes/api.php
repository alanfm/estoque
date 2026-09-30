<?php

use App\Core\Auth\Http\Controllers\ChangePasswordController;
use App\Core\Auth\Http\Controllers\E2eRoleLoginController;
use App\Core\Auth\Http\Controllers\ForgotPasswordController;
use App\Core\Auth\Http\Controllers\LoginController;
use App\Core\Auth\Http\Controllers\LogoutController;
use App\Core\Auth\Http\Controllers\ResetPasswordController;
use App\Core\Auth\Http\Controllers\ShowAuthenticatedUserController;
use App\Core\Authorization\Http\Controllers\DeleteRoleController;
use App\Core\Authorization\Http\Controllers\DeleteUserController;
use App\Core\Authorization\Http\Controllers\ListPermissionsController;
use App\Core\Authorization\Http\Controllers\ListRolesController;
use App\Core\Authorization\Http\Controllers\ListUsersController;
use App\Core\Authorization\Http\Controllers\ShowRoleController;
use App\Core\Authorization\Http\Controllers\ShowUserController;
use App\Core\Authorization\Http\Controllers\StoreRoleController;
use App\Core\Authorization\Http\Controllers\StoreUserController;
use App\Core\Authorization\Http\Controllers\UpdateRoleController;
use App\Core\Authorization\Http\Controllers\UpdateUserController;
use App\Core\Http\Controllers\ShowSystemStatusController;
use Illuminate\Support\Facades\Route;

Route::get('/system/status', ShowSystemStatusController::class);

Route::middleware('web')->prefix('auth')->name('auth.')->group(function (): void {
    Route::post('/login', LoginController::class)->middleware('throttle:auth-ip')->name('login');
    Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:auth-ip')->name('forgot-password');
    Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:auth-ip')->name('reset-password');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/user', ShowAuthenticatedUserController::class)->name('user');
        Route::post('/logout', LogoutController::class)->name('logout');
        Route::put('/password', ChangePasswordController::class)->middleware('throttle:auth-ip')->name('password');
    });
});

if (app()->environment('testing') || (app()->environment('local') && config('app.e2e_role_actors'))) {
    Route::middleware(['web', 'auth:sanctum'])->post('/e2e/role-login/{role}', E2eRoleLoginController::class);
}

Route::middleware(['web', 'auth:sanctum'])->prefix('admin')->name('admin.')->group(function (): void {
    Route::get('/users', ListUsersController::class)->name('users.index');
    Route::post('/users', StoreUserController::class)->name('users.store');
    Route::get('/users/{user}', ShowUserController::class)->name('users.show');
    Route::patch('/users/{user}', UpdateUserController::class)->name('users.update');
    Route::delete('/users/{user}', DeleteUserController::class)->name('users.destroy');

    Route::get('/roles', ListRolesController::class)->name('roles.index');
    Route::post('/roles', StoreRoleController::class)->name('roles.store');
    Route::get('/roles/{role}', ShowRoleController::class)->name('roles.show');
    Route::patch('/roles/{role}', UpdateRoleController::class)->name('roles.update');
    Route::delete('/roles/{role}', DeleteRoleController::class)->name('roles.destroy');

    Route::get('/permissions', ListPermissionsController::class)->name('permissions.index');
});
