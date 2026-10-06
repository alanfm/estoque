<?php

namespace App\Core\Modules\Http\Controllers;

use App\Core\Modules\Actions\ManageModulesAction;
use App\Core\Modules\Http\Requests\EnableModuleRequest;
use Illuminate\Http\Response;

final class EnableModuleController
{
    public function __invoke(EnableModuleRequest $request, ManageModulesAction $action, string $module): Response
    {
        $action->execute('enable', name: $module);

        return response()->noContent();
    }
}
