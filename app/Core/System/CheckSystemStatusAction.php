<?php

namespace App\Core\System;

use Illuminate\Support\Facades\DB;

final class CheckSystemStatusAction
{
    /** @return array{status: string, database: ?string} */
    public function execute(?string $check): array
    {
        if ($check === 'database') {
            DB::selectOne('SELECT 1');
        }

        return ['status' => 'ok', 'database' => $check === 'database' ? 'ok' : null];
    }
}
