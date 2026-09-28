<?php

namespace App\Core\Modules\Console;

use App\Core\Modules\ModuleRegistry;
use Illuminate\Console\Command;

/**
 * Expõe as entradas frontend habilitadas em JSON para o build e para pipelines.
 */
final class ModuleEntriesCommand extends Command
{
    protected $signature = 'core:modules:entries';

    protected $description = 'Emite em JSON as entradas frontend dos módulos habilitados';

    public function handle(ModuleRegistry $registry): int
    {
        $entries = [];
        $missing = [];

        foreach ($registry->frontendEntries() as $entry) {
            if (! is_file($entry['absolutePath'])) {
                $missing[] = $entry['name'];
            }

            $entries[] = $entry;
        }

        $this->line((string) json_encode($entries, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        if ($missing !== []) {
            $this->components->error(sprintf(
                'Entrada frontend ausente para: %s.',
                implode(', ', $missing),
            ));

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
