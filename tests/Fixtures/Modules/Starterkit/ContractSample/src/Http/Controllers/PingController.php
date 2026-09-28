<?php

namespace Starterkit\ContractSample\Http\Controllers;

use Illuminate\Http\JsonResponse;

final class PingController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'data' => [
                'module' => 'contract-sample',
                'status' => 'ok',
            ],
        ]);
    }
}
