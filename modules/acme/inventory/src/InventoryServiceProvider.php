<?php

namespace Acme\Inventory;

use App\Core\Modules\ModuleDescriptor;
use App\Core\Modules\ModuleServiceProvider;

final class InventoryServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'inventory';
    }

    protected function bootModule(ModuleDescriptor $module): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([Console\InstallInventoryCommand::class]);
        }
    }
}
