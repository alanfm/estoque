<?php

namespace App\Core\Modules\Http\Controllers;

use App\Core\Modules\Actions\ManageModulesAction;
use App\Core\Modules\Http\Requests\InstallModuleRequest;
use Illuminate\Http\Response;

final class InstallModuleController
{
    public function __invoke(InstallModuleRequest $request, ManageModulesAction $action): Response
    {
        $action->execute('install', repository: $request->validated('repository'));

        return response()->noContent();
    }
}
