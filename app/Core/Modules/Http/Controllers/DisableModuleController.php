<?php

namespace App\Core\Modules\Http\Controllers;

use App\Core\Modules\Actions\ManageModulesAction;
use App\Core\Modules\Http\Requests\DisableModuleRequest;
use Illuminate\Http\Response;

final class DisableModuleController
{
    public function __invoke(DisableModuleRequest $request, ManageModulesAction $action, string $module): Response
    {
        $action->execute('disable', name: $module);

        return response()->noContent();
    }
}
