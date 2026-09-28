<?php

namespace App\Core\Authorization\Console;

use App\Core\Authorization\CorePermissions;
use App\Core\Authorization\PermissionSynchronizer;
use App\Core\Modules\ModuleRegistry;
use Illuminate\Console\Command;

final class SyncPermissionsCommand extends Command
{
    protected $signature = 'core:sync-permissions';

    protected $description = 'Sincroniza o catálogo de permissões do núcleo e dos módulos habilitados sem apagar atribuições';

    public function handle(PermissionSynchronizer $synchronizer, ModuleRegistry $registry): int
    {
        $definitions = [
            ...CorePermissions::definitions(),
            ...$registry->permissionDefinitions(),
        ];

        $result = $synchronizer->sync($definitions);

        $this->components->info(sprintf(
            'Permissões sincronizadas: created=%d updated=%d restored=%d obsoleted=%d',
            $result->created,
            $result->updated,
            $result->restored,
            $result->obsoleted,
        ));

        return self::SUCCESS;
    }
}
