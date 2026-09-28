<?php

use App\Core\Authorization\AuthorizationServiceProvider;
use App\Core\Modules\ModulesServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    ModulesServiceProvider::class,
    AuthorizationServiceProvider::class,
];
