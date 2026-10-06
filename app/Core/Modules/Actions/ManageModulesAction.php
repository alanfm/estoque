<?php

namespace App\Core\Modules\Actions;

use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleStateStore;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;
use Throwable;

/** Serializa alterações de pacotes, estado e assets no host mutável. */
final class ManageModulesAction
{
    public function __construct(
        private readonly ModuleRegistry $registry,
        private readonly ModuleStateStore $state,
        private readonly CheckModuleCompatibilityAction $compatibility,
    ) {}

    public function execute(string $operation, ?string $name = null, ?string $repository = null): void
    {
        if (! config('modules.management_enabled')) {
            throw ValidationException::withMessages(['module' => 'Este host usa implantação imutável. Execute a operação no ambiente de build e publique uma nova imagem.']);
        }
        File::ensureDirectoryExists(storage_path('app'));
        $lock = fopen(storage_path('app/module-management.lock'), 'c');
        if ($lock === false || ! flock($lock, LOCK_EX | LOCK_NB)) {
            if (is_resource($lock)) {
                fclose($lock);
            }
            throw ValidationException::withMessages(['module' => 'Outra operação de módulos está em andamento.']);
        }
        @set_time_limit(900);
        $snapshots = [];
        foreach (['composer.json', 'composer.lock', (string) config('modules.state_path')] as $file) {
            $path = str_starts_with($file, '/') ? $file : base_path($file);
            $snapshots[$path] = is_file($path) ? File::get($path) : null;
        }
        $stage = storage_path('app/module-install-'.bin2hex(random_bytes(8)));
        $added = null;
        $removed = null;
        $composerChanged = false;
        $stateChanged = false;
        try {
            if ($operation === 'install') {
                if (! is_string($repository) || ! preg_match('~^https://github\.com/([A-Za-z0-9][A-Za-z0-9-]*)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$~D', $repository, $matches) || in_array($matches[2], ['.', '..'], true)) {
                    throw ValidationException::withMessages(['repository' => 'Informe o link HTTPS de um repositório GitHub: https://github.com/organização/módulo.']);
                }
                $url = 'https://github.com/'.$matches[1].'/'.$matches[2].'.git';
                $this->run(['git', '-c', 'core.hooksPath=/dev/null', 'clone', '--depth', '1', '--', $url, $stage]);
                // Nenhum código do pacote é executado antes deste preflight.
                if (! is_file($stage.'/module.json') || ! is_file($stage.'/composer.json')) {
                    throw ValidationException::withMessages(['repository' => 'O repositório deve conter module.json e composer.json na raiz.']);
                }
                foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($stage, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::SELF_FIRST) as $file) {
                    if ($file->isLink()) {
                        throw ValidationException::withMessages(['repository' => 'O pacote não pode conter links simbólicos.']);
                    }
                }
                $manifest = $this->compatibility->execute($stage);
                $composer = json_decode(File::get($stage.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);
                $package = $composer['name'];
                $added = base_path('modules/'.$package);
                if (file_exists($added) || isset(json_decode(File::get(base_path('composer.json')), true)['require'][$package])) {
                    $added = null;
                    throw ValidationException::withMessages(['repository' => 'Este pacote já está instalado no host.']);
                }
                File::ensureDirectoryExists(dirname($added));
                File::deleteDirectory($stage.'/.git');
                $composer['version'] = $manifest->version;
                File::put($stage.'/composer.json', json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
                File::moveDirectory($stage, $added);
                // Instala desabilitado; ativação e migrations são uma operação explícita.
                $stateChanged = true;
                $this->state->disable($manifest->name);
                $this->run(['composer', 'require', $package.':'.$manifest->version, '--dry-run', '--no-interaction', '--no-scripts', '--no-plugins']);
                $composerChanged = true;
                $this->run(['composer', 'require', $package.':'.$manifest->version, '--no-interaction', '--no-scripts', '--no-plugins']);
                $this->run([PHP_BINARY, 'artisan', 'package:discover']);
                // Processo novo: valida os providers pelo autoload recém-gerado.
                $this->run([PHP_BINARY, 'artisan', 'core:modules:validate', $manifest->name]);
            } else {
                $module = $this->registry->find((string) $name);
                abort_if($module === null, 404);
                if ($operation === 'enable') {
                    $stateChanged = true;
                    $this->run([PHP_BINARY, 'artisan', 'core:modules:validate', $name]);
                    $this->run([PHP_BINARY, 'artisan', 'core:modules:enable', $name]);
                    $this->run([PHP_BINARY, 'artisan', 'migrate', '--force']);
                } else {
                    $dependents = $this->registry->dependentsOf((string) $name);
                    if ($dependents !== []) {
                        throw ValidationException::withMessages(['module' => 'Desabilite primeiro os dependentes: '.implode(', ', $dependents).'.']);
                    }
                    $stateChanged = true;
                    $this->state->disable((string) $name);
                    if ($operation === 'remove') {
                        $composer = json_decode(File::get($module->path.'/composer.json'), true, flags: JSON_THROW_ON_ERROR);
                        $package = $composer['name'];
                        // Apenas pacotes locais do contrato podem ser removidos por esta API.
                        if (realpath($module->path) !== realpath(base_path('modules/'.$package))) {
                            throw ValidationException::withMessages(['module' => 'O pacote deve estar em modules/vendor/package para remoção pelo painel.']);
                        }
                        $composerChanged = true;
                        $this->run(['composer', 'remove', $package, '--no-interaction', '--no-scripts', '--no-plugins']);
                        $removed = $module->path;
                        File::moveDirectory($removed, $stage);
                        $this->run([PHP_BINARY, 'artisan', 'package:discover']);
                    }
                }
            }
            $this->run(['npm', 'run', 'build']);
            $this->run([PHP_BINARY, 'artisan', 'core:sync-permissions']);
            $this->registry->refresh();
        } catch (Throwable $exception) {
            if ($stateChanged || $composerChanged) {
                foreach ($snapshots as $path => $contents) {
                    $contents === null ? File::delete($path) : File::put($path, $contents);
                }
            }
            if ($added !== null) {
                File::deleteDirectory($added);
            }
            if ($removed !== null && is_dir($stage)) {
                File::moveDirectory($stage, $removed);
            }
            try {
                if ($composerChanged) {
                    $this->run(['composer', 'install', '--no-interaction', '--no-scripts', '--no-plugins']);
                    $this->run([PHP_BINARY, 'artisan', 'package:discover']);
                }
                if ($stateChanged || $composerChanged) {
                    $this->run(['npm', 'run', 'build']);
                    $this->run([PHP_BINARY, 'artisan', 'core:sync-permissions']);
                }
            } catch (Throwable $recovery) {
                report($recovery);
            }
            $this->registry->refresh();
            throw $exception;
        } finally {
            File::deleteDirectory($stage);
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /** @param list<string|null> $command */
    private function run(array $command): void
    {
        $result = Process::path(base_path())->timeout(300)->env(['GIT_TERMINAL_PROMPT' => '0'])->run($command);
        if ($result->failed()) {
            logger()->error('Falha na operação de módulos', ['command' => $command, 'output' => $result->errorOutput()]);
            throw ValidationException::withMessages(['module' => 'Falha na etapa '.$command[0].' '.($command[1] ?? '').'. Consulte o log do servidor.']);
        }
    }
}
