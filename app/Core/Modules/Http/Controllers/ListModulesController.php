<?php

namespace App\Core\Modules\Http\Controllers;

use App\Core\Modules\Http\Requests\ListModuleRequest;
use App\Core\Modules\Http\Resources\ModuleResource;
use App\Core\Modules\ModuleRegistry;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class ListModulesController
{
    public function __invoke(ListModuleRequest $request, ModuleRegistry $registry): AnonymousResourceCollection
    {
        return ModuleResource::collection(array_values($registry->all()))->additional([
            'meta' => [
                'coreVersion' => $registry->coreVersion(),
                'managementEnabled' => (bool) config('modules.management_enabled'),
                'issues' => $registry->issues(),
            ],
        ]);
    }
}
