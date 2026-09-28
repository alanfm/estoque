<?php

namespace App\Core\Http\Controllers;

use App\Core\Http\Requests\ShowSystemStatusRequest;
use App\Core\Http\Resources\SystemStatusResource;
use App\Core\System\CheckSystemStatusAction;

final class ShowSystemStatusController
{
    public function __invoke(ShowSystemStatusRequest $request, CheckSystemStatusAction $action): SystemStatusResource
    {
        return new SystemStatusResource($action->execute($request->validated('check')));
    }
}
