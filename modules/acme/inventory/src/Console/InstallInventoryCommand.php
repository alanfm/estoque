<?php

namespace Acme\Inventory\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class InstallInventoryCommand extends Command
{
    protected $signature = 'inventory:install';

    protected $description = 'Inicializa o local padrão do Almoxarifado de TI';

    public function handle(): int
    {
        DB::table('inventory_locations')->updateOrInsert(
            ['code' => 'TI'],
            ['name' => 'Almoxarifado TI', 'active' => true, 'updated_at' => now(), 'created_at' => now()],
        );
        $this->components->info('Local Almoxarifado TI disponível.');

        return self::SUCCESS;
    }
}
