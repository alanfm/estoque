<?php

namespace App\Core\Modules;

/**
 * Manifesto `module.json` validado.
 */
final class ModuleManifest
{
    public const SCHEMA_VERSION = 1;

    /**
     * @param  list<array{name: string, version: string}>  $dependencies
     * @param  list<string>  $permissions
     */
    public function __construct(
        public readonly int $schemaVersion,
        public readonly string $name,
        public readonly string $displayName,
        public readonly string $version,
        public readonly string $core,
        public readonly string $apiPrefix,
        public readonly string $frontendEntry,
        public readonly array $dependencies,
        public readonly array $permissions,
    ) {}

    /**
     * @return list<array{name: string, module: string, description: null}>
     */
    public function permissionDefinitions(): array
    {
        return array_map(
            fn (string $permission): array => [
                'name' => $permission,
                'module' => $this->name,
                'description' => null,
            ],
            $this->permissions,
        );
    }
}
