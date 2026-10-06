<?php

namespace App\Core\Modules\Actions;

use App\Core\Modules\ModuleComposerPackage;
use App\Core\Modules\ModuleManifest;
use App\Core\Modules\ModuleManifestParser;
use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleValidationException;
use App\Core\Modules\Support\VersionRange;
use Illuminate\Validation\ValidationException;

final class CheckModuleCompatibilityAction
{
    public function __construct(private readonly ModuleRegistry $registry) {}

    public function execute(string $path): ModuleManifest
    {
        try {
            $data = json_decode((string) file_get_contents($path.'/module.json'), true, flags: JSON_THROW_ON_ERROR);
            $manifest = (new ModuleManifestParser)->parse(is_array($data) ? $data : []);
        } catch (\JsonException|ModuleValidationException $exception) {
            throw ValidationException::withMessages(['repository' => [$exception->getMessage()]]);
        }

        $issues = (new ModuleComposerPackage)->inspect($path, PHP_VERSION, app()->version(), false)['issues'];
        $composer = json_decode((string) file_get_contents($path.'/composer.json'), true);
        if (isset($composer['version']) && $composer['version'] !== $manifest->version) {
            $issues[] = 'A versão Composer deve corresponder à versão do manifesto.';
        }
        if (! VersionRange::satisfies($this->registry->coreVersion(), $manifest->core)) {
            $issues[] = 'A versão do núcleo não satisfaz a faixa '.$manifest->core.'.';
        }
        if (in_array($manifest->apiPrefix, ['admin', 'auth', 'system'], true)) {
            $issues[] = 'Prefixo de API reservado ao núcleo.';
        }
        if (! is_file($path.'/'.$manifest->frontendEntry)) {
            $issues[] = 'Entrada frontend ausente.';
        }
        foreach ($this->registry->all() as $installed) {
            if ($installed->manifest->name === $manifest->name || $installed->manifest->apiPrefix === $manifest->apiPrefix) {
                $issues[] = 'O identificador ou prefixo de API já pertence a um módulo instalado.';
            }
        }
        foreach ($manifest->dependencies as $dependency) {
            $installed = $this->registry->find($dependency['name']);
            if (! $installed?->enabled || ! VersionRange::satisfies($installed->manifest->version, $dependency['version'])) {
                $issues[] = 'Dependência ausente, desabilitada ou incompatível: '.$dependency['name'].'.';
            }
        }
        if ($issues !== []) {
            throw ValidationException::withMessages(['repository' => $issues]);
        }

        return $manifest;
    }
}
