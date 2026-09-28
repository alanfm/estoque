<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use Illuminate\Console\Command;

final class ListModulesCommand extends Command
{
    protected $signature = 'core:modules:list {--json : Emite a lista em JSON}';

    protected $description = 'Lista os módulos descobertos e seu estado de habilitação';

    public function handle(ModuleRegistry $registry): int
    {
        if ($this->option('json')) {
            $this->line((string) json_encode(
                array_map(
                    static fn ($module): array => [
                        'name' => $module->manifest->name,
                        'displayName' => $module->manifest->displayName,
                        'version' => $module->manifest->version,
                        'core' => $module->manifest->core,
                        'enabled' => $module->enabled,
                        'issues' => $module->issues,
                    ],
                    array_values($registry->all()),
                ),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES,
            ));

            return self::SUCCESS;
        }

        if ($registry->all() === []) {
            $this->components->info('Nenhum módulo descoberto.');

            return self::SUCCESS;
        }

        $this->table(
            ['Módulo', 'Versão', 'Núcleo', 'Habilitado', 'Problemas'],
            array_map(
                static fn ($module): array => [
                    $module->manifest->name,
                    $module->manifest->version,
                    $module->manifest->core,
                    $module->enabled ? 'sim' : 'não',
                    (string) count($module->issues),
                ],
                array_values($registry->all()),
            ),
        );

        return self::SUCCESS;
    }
}
