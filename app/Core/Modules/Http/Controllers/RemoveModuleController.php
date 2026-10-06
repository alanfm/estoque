<?php

namespace App\Core\Modules\Http\Controllers;

use App\Core\Modules\Actions\ManageModulesAction;
use App\Core\Modules\Http\Requests\RemoveModuleRequest;
use Illuminate\Http\Response;

final class RemoveModuleController
{
    public function __invoke(RemoveModuleRequest $request, ManageModulesAction $action, string $module): Response
    {
        $action->execute('remove', name: $module);

        return response()->noContent();
    }
}
