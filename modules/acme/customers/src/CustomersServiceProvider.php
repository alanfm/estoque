<?php

namespace Acme\Customers;

use Acme\Customers\Models\Customer;
use Acme\Customers\Policies\CustomerPolicy;
use App\Core\Modules\ModuleDescriptor;
use App\Core\Modules\ModuleServiceProvider;
use Illuminate\Support\Facades\Gate;

final class CustomersServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'customers';
    }

    protected function registerBindings(ModuleDescriptor $module): void
    {
        Gate::policy(Customer::class, CustomerPolicy::class);
    }
}
