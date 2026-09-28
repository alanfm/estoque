<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use Illuminate\Console\Command;

/**
 * Diagnóstico não interativo para pipelines.
 *
 * Retorna código de saída diferente de zero quando há manifesto inválido,
 * dependência ausente/circular, incompatibilidade de versão ou provider que
 * não pode ser carregado.
 */
final class DiagnoseModulesCommand extends Command
{
    protected $signature = 'core:modules:diagnose {--json : Emite o diagnóstico em JSON}';

    protected $description = 'Valida manifestos, compatibilidade, dependências e providers dos módulos';

    public function handle(ModuleRegistry $registry): int
    {
        $modules = array_values($registry->all());
        $issues = $registry->issues();

        if ($this->option('json')) {
            $this->line((string) json_encode([
                'coreVersion' => $registry->coreVersion(),
                'modules' => array_map(
                    static fn ($module): array => [
                        'name' => $module->manifest->name,
                        'version' => $module->manifest->version,
                        'enabled' => $module->enabled,
                        'providers' => $module->providers,
                        'issues' => $module->issues,
                    ],
                    $modules,
                ),
                'issues' => $issues,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return $issues === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->components->info(sprintf(
            'Núcleo %s · %d módulo(s) descoberto(s)',
            $registry->coreVersion(),
            count($modules),
        ));

        foreach ($modules as $module) {
            $status = $module->enabled ? 'habilitado' : 'desabilitado';

            if ($module->issues === []) {
                $this->components->twoColumnDetail(
                    sprintf('%s %s', $module->manifest->name, $module->manifest->version),
                    "<fg=green>{$status}</>",
                );

                continue;
            }

            $this->components->twoColumnDetail(
                sprintf('%s %s', $module->manifest->name, $module->manifest->version),
                '<fg=red>inválido</>',
            );

            foreach ($module->issues as $issue) {
                $this->components->bulletList([$issue]);
            }
        }

        if ($issues !== []) {
            $this->newLine();
            $this->components->error(sprintf('%d problema(s) encontrado(s).', count($issues)));

            return self::FAILURE;
        }

        $this->components->info('Nenhum problema encontrado.');

        return self::SUCCESS;
    }
}
