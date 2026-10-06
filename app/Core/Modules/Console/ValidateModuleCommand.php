<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleServiceProvider;
use Illuminate\Console\Command;

final class ValidateModuleCommand extends Command
{
    protected $signature = 'core:modules:validate {name : Identificador do módulo}';

    protected $description = 'Valida um módulo instalado sem alterar seu estado';

    public function handle(ModuleRegistry $registry): int
    {
        $module = $registry->find((string) $this->argument('name'));
        if ($module === null) {
            $this->components->error('Módulo não encontrado.');

            return self::FAILURE;
        }
        $issues = $module->issues;
        foreach ($module->providers as $provider) {
            if (! is_subclass_of($provider, ModuleServiceProvider::class)) {
                $issues[] = 'O provider deve estender ModuleServiceProvider: '.$provider;
            }
        }
        if ($issues !== []) {
            $this->components->bulletList($issues);

            return self::FAILURE;
        }
        $this->components->info('Módulo válido.');

        return self::SUCCESS;
    }
}
