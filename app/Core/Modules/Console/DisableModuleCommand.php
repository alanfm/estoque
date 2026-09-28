<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleStateStore;
use Illuminate\Console\Command;

final class DisableModuleCommand extends Command
{
    protected $signature = 'core:modules:disable {name : Identificador do módulo}';

    protected $description = 'Desabilita um módulo preservando dados e permissões';

    public function handle(ModuleRegistry $registry, ModuleStateStore $state): int
    {
        $name = (string) $this->argument('name');
        $module = $registry->find($name);

        if ($module === null) {
            $this->components->error(sprintf('Módulo "%s" não foi descoberto.', $name));

            return self::FAILURE;
        }

        $dependents = $registry->dependentsOf($name);

        if ($dependents !== []) {
            $this->components->error(sprintf(
                'O módulo "%s" não pode ser desabilitado; depende dele: %s.',
                $name,
                implode(', ', $dependents),
            ));

            return self::FAILURE;
        }

        $state->disable($name);
        $registry->refresh();

        $this->components->info(sprintf(
            'Módulo "%s" desabilitado. Dados preservados; permissões permanecem obsoletas até nova sincronização.',
            $name,
        ));

        return self::SUCCESS;
    }
}
