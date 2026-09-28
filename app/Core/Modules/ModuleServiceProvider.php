<?php

namespace App\Core\Modules;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Classe-base pública para os Service Providers dos módulos.
 *
 * O provider de um módulo DEVE estendê-la e implementar `moduleName()`. A base
 * só carrega rotas, migrations, traduções e bindings quando o módulo está
 * habilitado e sem erros de validação, o que preserva os dados ao desabilitar.
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    abstract protected function moduleName(): string;

    public function boot(): void
    {
        $module = $this->activeModule();

        if ($module === null) {
            return;
        }

        $this->registerBindings($module);
        $this->registerRoutes($module);
        $this->registerMigrations($module);
        $this->registerTranslations($module);
        $this->bootModule($module);
    }

    protected function registerBindings(ModuleDescriptor $module): void {}

    protected function bootModule(ModuleDescriptor $module): void {}

    /**
     * @return list<string>
     */
    protected function routeMiddleware(): array
    {
        return ['web'];
    }

    private function registerRoutes(ModuleDescriptor $module): void
    {
        $routes = rtrim($module->path, '/').'/routes/api.php';

        if (! is_file($routes)) {
            return;
        }

        Route::middleware($this->routeMiddleware())
            ->prefix('api/v1/'.$module->manifest->apiPrefix)
            ->name($module->manifest->name.'.')
            ->group($routes);
    }

    private function registerMigrations(ModuleDescriptor $module): void
    {
        $migrations = rtrim($module->path, '/').'/database/migrations';

        if (is_dir($migrations)) {
            $this->loadMigrationsFrom($migrations);
        }
    }

    private function registerTranslations(ModuleDescriptor $module): void
    {
        $translations = rtrim($module->path, '/').'/resources/lang';

        if (is_dir($translations)) {
            $this->loadTranslationsFrom($translations, $module->manifest->name);
        }
    }

    private function activeModule(): ?ModuleDescriptor
    {
        $descriptor = $this->app->make(ModuleRegistry::class)->find($this->moduleName());

        return $descriptor?->isActive() === true ? $descriptor : null;
    }
}
