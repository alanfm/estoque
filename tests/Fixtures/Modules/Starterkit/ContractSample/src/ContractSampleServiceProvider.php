<?php

namespace Starterkit\ContractSample;

use App\Core\Modules\ModuleServiceProvider;

final class ContractSampleServiceProvider extends ModuleServiceProvider
{
    protected function moduleName(): string
    {
        return 'contract-sample';
    }
}
