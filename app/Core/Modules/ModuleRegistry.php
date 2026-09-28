<?php

namespace App\Core\Modules;

use App\Core\Modules\Support\VersionRange;

/**
 * Descobre, valida e mantém o estado dos módulos instalados.
 *
 * A descoberta lê apenas o disco e o arquivo de estado, sem consultar o banco,
 * para poder ser usada durante o boot da aplicação.
 */
final class ModuleRegistry
{
    /** @var array<string, ModuleDescriptor>|null */
    private ?array $descriptors = null;

    /** @var list<string> */
    private array $issues = [];

    public function __construct(
        private readonly ModuleDiscovery $discovery,
        private readonly ModuleStateStore $state,
        private readonly ModuleManifestParser $parser = new ModuleManifestParser,
        private readonly ModuleComposerPackage $packages = new ModuleComposerPackage,
        private readonly string $coreVersion = '1.0.0-dev.0',
        private readonly string $phpVersion = PHP_VERSION,
        private readonly string $laravelVersion = '13.0.0',
    ) {}

    /** @return array<string, ModuleDescriptor> */
    public function all(): array
    {
        $this->load();

        return $this->descriptors ?? [];
    }

    /** @return array<string, ModuleDescriptor> */
    public function enabled(): array
    {
        return array_filter($this->all(), static fn (ModuleDescriptor $module): bool => $module->enabled);
    }

    public function find(string $name): ?ModuleDescriptor
    {
        return $this->all()[$name] ?? null;
    }

    public function has(string $name): bool
    {
        return $this->find($name) !== null;
    }

    /** @return list<array{name: string, module: string, description: null}> */
    public function permissionDefinitions(): array
    {
        $definitions = [];

        foreach ($this->enabled() as $module) {
            $definitions = [...$definitions, ...$module->manifest->permissionDefinitions()];
        }

        return $definitions;
    }

    /** @return list<string> */
    public function permissionNames(): array
    {
        return array_map(
            static fn (array $definition): string => $definition['name'],
            $this->permissionDefinitions(),
        );
    }

    /** @return list<array{name: string, entry: string, absolutePath: string}> */
    public function frontendEntries(): array
    {
        $entries = [];

        foreach ($this->enabled() as $module) {
            $entries[] = [
                'name' => $module->manifest->name,
                'entry' => $module->manifest->frontendEntry,
                'absolutePath' => $module->frontendEntryPath(),
            ];
        }

        return $entries;
    }

    /** @return list<string> */
    public function issues(): array
    {
        $this->load();

        return $this->issues;
    }

    /** @return list<string> */
    public function dependentsOf(string $name): array
    {
        $dependents = [];

        foreach ($this->enabled() as $module) {
            foreach ($module->manifest->dependencies as $dependency) {
                if ($dependency['name'] === $name) {
                    $dependents[] = $module->manifest->name;
                    break;
                }
            }
        }

        return $dependents;
    }

    public function refresh(): void
    {
        $this->descriptors = null;
        $this->issues = [];
    }

    public function coreVersion(): string
    {
        return $this->coreVersion;
    }

    private function load(): void
    {
        if ($this->descriptors !== null) {
            return;
        }

        [$candidates, $issues] = $this->discovery->discover();
        $manifests = [];
        $paths = [];
        $moduleIssues = [];

        foreach ($candidates as $candidate) {
            try {
                $manifest = $this->parser->parse($candidate->data);
            } catch (ModuleValidationException $exception) {
                $issues[] = $exception->getMessage();

                continue;
            }

            if (isset($manifests[$manifest->name])) {
                $issues[] = sprintf('Identificador de módulo duplicado: "%s".', $manifest->name);

                continue;
            }

            $manifests[$manifest->name] = $manifest;
            $paths[$manifest->name] = $candidate->path;
            $moduleIssues[$manifest->name] = [];
        }

        $this->checkPermissionsUniqueness($manifests, $moduleIssues, $issues);

        $packageResults = [];

        foreach ($manifests as $name => $manifest) {
            $packageResults[$name] = $this->packages->inspect($paths[$name], $this->phpVersion, $this->laravelVersion);

            $moduleIssues[$name] = [
                ...$moduleIssues[$name],
                ...$this->checkCoreCompatibility($manifest),
                ...$this->checkDependencies($manifest, $manifests),
                ...$packageResults[$name]['issues'],
            ];
        }

        $this->checkDependenciesCycles($manifests, $moduleIssues);

        $descriptors = [];

        foreach ($manifests as $name => $manifest) {
            $moduleIssues[$name] = array_values(array_unique($moduleIssues[$name]));

            foreach ($moduleIssues[$name] as $issue) {
                $issues[] = sprintf('[%s] %s', $name, $issue);
            }

            $providers = $moduleIssues[$name] === [] ? $packageResults[$name]['providers'] : [];

            $descriptors[$name] = new ModuleDescriptor(
                manifest: $manifest,
                path: $paths[$name],
                enabled: $moduleIssues[$name] === [] && $this->state->isEnabled($name),
                issues: $moduleIssues[$name],
                providers: $providers,
            );
        }

        ksort($descriptors);

        $this->descriptors = $descriptors;
        $this->issues = array_values(array_unique($issues));
    }

    /**
     * @param  array<string, ModuleManifest>  $manifests
     * @param  array<string, list<string>>  $moduleIssues
     * @param  list<string>  $issues
     */
    private function checkPermissionsUniqueness(array $manifests, array &$moduleIssues, array &$issues): void
    {
        $owners = [];

        foreach ($manifests as $name => $manifest) {
            foreach ($manifest->permissions as $permission) {
                if (isset($owners[$permission]) && $owners[$permission] !== $name) {
                    $issue = sprintf('Permissão "%s" já declarada pelo módulo "%s".', $permission, $owners[$permission]);
                    $moduleIssues[$name][] = $issue;
                    $moduleIssues[$owners[$permission]][] = $issue;
                    $issues[] = $issue;

                    continue;
                }

                $owners[$permission] = $name;
            }
        }
    }

    /** @return list<string> */
    private function checkCoreCompatibility(ModuleManifest $manifest): array
    {
        if (VersionRange::satisfies($this->coreVersion, $manifest->core)) {
            return [];
        }

        return [sprintf(
            'Núcleo %s não satisfaz a faixa "%s" declarada pelo módulo.',
            $this->coreVersion,
            $manifest->core,
        )];
    }

    /**
     * @param  array<string, ModuleManifest>  $manifests
     * @return list<string>
     */
    private function checkDependencies(ModuleManifest $manifest, array $manifests): array
    {
        $issues = [];

        foreach ($manifest->dependencies as $dependency) {
            $target = $manifests[$dependency['name']] ?? null;

            if ($target === null) {
                $issues[] = sprintf('Dependência ausente: módulo "%s".', $dependency['name']);

                continue;
            }

            if (! VersionRange::satisfies($target->version, $dependency['version'])) {
                $issues[] = sprintf(
                    'Dependência "%s" está na versão %s, fora da faixa "%s".',
                    $dependency['name'],
                    $target->version,
                    $dependency['version'],
                );
            }

            if ($dependency['name'] === $manifest->name) {
                $issues[] = 'Módulo não pode depender de si mesmo.';
            }
        }

        return $issues;
    }

    /**
     * @param  array<string, ModuleManifest>  $manifests
     * @param  array<string, list<string>>  $moduleIssues
     */
    private function checkDependenciesCycles(array $manifests, array &$moduleIssues): void
    {
        $visiting = [];
        $visited = [];

        $visit = function (string $name, array $stack) use (&$visit, &$visiting, &$visited, $manifests, &$moduleIssues): void {
            if (isset($visited[$name])) {
                return;
            }

            if (isset($visiting[$name])) {
                $cycle = [...array_slice($stack, array_search($name, $stack, true)), $name];
                $description = implode(' → ', $cycle);

                foreach (array_unique($cycle) as $node) {
                    $moduleIssues[$node][] = sprintf('Dependência circular detectada: %s.', $description);
                }

                return;
            }

            $visiting[$name] = true;

            foreach ($manifests[$name]->dependencies as $dependency) {
                if (isset($manifests[$dependency['name']])) {
                    $visit($dependency['name'], [...$stack, $name]);
                }
            }

            unset($visiting[$name]);
            $visited[$name] = true;
        };

        foreach (array_keys($manifests) as $name) {
            $visit($name, []);
        }
    }
}
