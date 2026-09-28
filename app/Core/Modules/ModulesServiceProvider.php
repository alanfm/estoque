<?php

namespace App\Core\Modules;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\ServiceProvider;

final class ModulesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(
            ModuleStateStore::class,
            fn (): ModuleStateStore => new ModuleStateStore((string) config('modules.state_path')),
        );

        $this->app->singleton(ModuleRegistry::class, function (Application $app): ModuleRegistry {
            return new ModuleRegistry(
                discovery: new ModuleDiscovery(config('modules.paths', [])),
                state: $app->make(ModuleStateStore::class),
                coreVersion: (string) config('modules.core_version'),
                phpVersion: PHP_VERSION,
                laravelVersion: $app->version(),
            );
        });
    }
}
