<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleStateStore;
use Illuminate\Console\Command;

final class EnableModuleCommand extends Command
{
    protected $signature = 'core:modules:enable {name : Identificador do módulo}';

    protected $description = 'Habilita um módulo instalado, validando dependências';

    public function handle(ModuleRegistry $registry, ModuleStateStore $state): int
    {
        $name = (string) $this->argument('name');
        $module = $registry->find($name);

        if ($module === null) {
            $this->components->error(sprintf('Módulo "%s" não foi descoberto.', $name));

            return self::FAILURE;
        }

        if ($module->issues !== []) {
            $this->components->error(sprintf('Módulo "%s" possui problemas e não pode ser habilitado:', $name));

            foreach ($module->issues as $issue) {
                $this->components->bulletList([$issue]);
            }

            return self::FAILURE;
        }

        $disabledDependencies = [];

        foreach ($module->manifest->dependencies as $dependency) {
            if (! $state->isEnabled($dependency['name'])) {
                $disabledDependencies[] = $dependency['name'];
            }
        }

        if ($disabledDependencies !== []) {
            $this->components->error(sprintf(
                'Habilite primeiro as dependências: %s.',
                implode(', ', $disabledDependencies),
            ));

            return self::FAILURE;
        }

        $state->enable($name);
        $registry->refresh();

        $this->components->info(sprintf('Módulo "%s" habilitado. Execute core:sync-permissions e recompile os assets.', $name));

        return self::SUCCESS;
    }
}
