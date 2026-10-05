<?php

namespace Database\Seeders;

use App\Core\Authorization\CorePermissions;
use App\Core\Authorization\PermissionSynchronizer;
use App\Core\Modules\ModuleRegistry;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(PermissionSynchronizer $synchronizer, ModuleRegistry $registry): void
    {
        $this->call(TestUsersSeeder::class);

        $synchronizer->sync([
            ...CorePermissions::definitions(),
            ...$registry->permissionDefinitions(),
        ]);
    }
}
