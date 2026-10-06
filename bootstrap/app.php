<?php

use App\Core\Auth\Console\BootstrapAdminCommand;
use App\Core\Authorization\Console\SyncPermissionsCommand;
use App\Core\Exceptions\ApiErrorResponse;
use App\Core\Http\Middleware\AssignRequestId;
use App\Core\Modules\Console\DiagnoseModulesCommand;
use App\Core\Modules\Console\DisableModuleCommand;
use App\Core\Modules\Console\EnableModuleCommand;
use App\Core\Modules\Console\ListModulesCommand;
use App\Core\Modules\Console\ModuleEntriesCommand;
use App\Core\Modules\Console\ValidateModuleCommand;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(AssignRequestId::class);
    })
    ->withCommands([
        BootstrapAdminCommand::class,
        SyncPermissionsCommand::class,
        ListModulesCommand::class,
        DiagnoseModulesCommand::class,
        EnableModuleCommand::class,
        DisableModuleCommand::class,
        ModuleEntriesCommand::class,
        ValidateModuleCommand::class,
    ])
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->context(fn (Throwable $exception, array $context): array => request()->is('api/*')
            ? ['requestId' => request()->attributes->get('requestId')]
            : []);
        $exceptions->render(fn (Throwable $exception, Request $request) => $request->is('api/*')
            ? ApiErrorResponse::from($exception, $request)
            : null);
    })->create();
