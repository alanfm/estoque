<?php

namespace App\Core\Modules;

use App\Core\Modules\Support\VersionRange;

final class ModuleManifestParser
{
    /**
     * @param  array<string, mixed>  $data
     *
     * @throws ModuleValidationException
     */
    public function parse(array $data): ModuleManifest
    {
        $name = is_string($data['name'] ?? null) ? $data['name'] : '(sem nome)';
        $errors = [];

        $schemaVersion = $data['schemaVersion'] ?? null;
        if (! is_int($schemaVersion)) {
            $errors[] = 'Campo "schemaVersion" ausente ou inválido.';
        } elseif ($schemaVersion !== ModuleManifest::SCHEMA_VERSION) {
            $errors[] = sprintf(
                'Versão de schema %d não suportada; o núcleo aceita a versão %d.',
                $schemaVersion,
                ModuleManifest::SCHEMA_VERSION,
            );
        }

        if (! preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/', $name)) {
            $errors[] = 'Campo "name" deve usar kebab-case iniciado por letra.';
        }

        $displayName = $data['displayName'] ?? null;
        if (! is_string($displayName) || trim($displayName) === '') {
            $errors[] = 'Campo "displayName" é obrigatório.';
        }

        $version = $data['version'] ?? null;
        if (! is_string($version) || ! preg_match('/^\d+\.\d+\.\d+$/', $version)) {
            $errors[] = 'Campo "version" deve seguir MAJOR.MINOR.PATCH.';
        }

        $core = $data['core'] ?? null;
        if (! is_string($core) || ! VersionRange::isValid($core)) {
            $errors[] = 'Campo "core" deve declarar uma faixa semântica válida.';
        }

        $apiPrefix = $data['apiPrefix'] ?? null;
        if (! is_string($apiPrefix) || ! preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/', $apiPrefix)) {
            $errors[] = 'Campo "apiPrefix" deve usar kebab-case iniciado por letra.';
        }

        $frontendEntry = $data['frontendEntry'] ?? null;
        if (! is_string($frontendEntry) || trim($frontendEntry) === '' || str_starts_with($frontendEntry, '/') || str_contains($frontendEntry, '..')) {
            $errors[] = 'Campo "frontendEntry" deve ser um caminho relativo dentro do módulo.';
        }

        [$dependencies, $dependencyErrors] = $this->parseDependencies($data['dependencies'] ?? null);
        $errors = [...$errors, ...$dependencyErrors];

        [$permissions, $permissionErrors] = $this->parsePermissions(
            $data['permissions'] ?? null,
            $name,
        );
        $errors = [...$errors, ...$permissionErrors];

        if ($errors !== []) {
            throw new ModuleValidationException($name, $errors);
        }

        return new ModuleManifest(
            schemaVersion: $schemaVersion,
            name: $name,
            displayName: trim($displayName),
            version: $version,
            core: $core,
            apiPrefix: $apiPrefix,
            frontendEntry: $frontendEntry,
            dependencies: $dependencies,
            permissions: $permissions,
        );
    }

    /**
     * @return array{list<array{name: string, version: string}>, list<string>}
     */
    private function parseDependencies(mixed $dependencies): array
    {
        if (! is_array($dependencies)) {
            return [[], ['Campo "dependencies" deve ser uma lista.']];
        }

        $parsed = [];
        $errors = [];

        foreach ($dependencies as $index => $dependency) {
            if (! is_array($dependency)) {
                $errors[] = sprintf('Dependência #%d deve ser um objeto.', $index);

                continue;
            }

            $name = $dependency['name'] ?? null;
            $version = $dependency['version'] ?? null;

            if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/', $name)) {
                $errors[] = sprintf('Dependência #%d possui "name" inválido.', $index);

                continue;
            }

            if (! is_string($version) || ! VersionRange::isValid($version)) {
                $errors[] = sprintf('Dependência "%s" possui faixa de versão inválida.', $name);

                continue;
            }

            $parsed[] = ['name' => $name, 'version' => $version];
        }

        return [$parsed, $errors];
    }

    /**
     * @return array{list<string>, list<string>}
     */
    private function parsePermissions(mixed $permissions, string $name): array
    {
        if (! is_array($permissions)) {
            return [[], ['Campo "permissions" deve ser uma lista.']];
        }

        $parsed = [];
        $errors = [];
        $seen = [];

        foreach ($permissions as $index => $permission) {
            if (! is_string($permission) || ! preg_match('/^[a-z][a-z0-9-]*(?:\.[a-zA-Z0-9]+)+$/', $permission)) {
                $errors[] = sprintf('Permissão #%d deve usar notação pontuada.', $index);

                continue;
            }

            if ($name !== '' && ! str_starts_with($permission, $name.'.')) {
                $errors[] = sprintf('Permissão "%s" deve ser prefixada por "%s.".', $permission, $name);

                continue;
            }

            if (isset($seen[$permission])) {
                $errors[] = sprintf('Permissão "%s" declarada mais de uma vez.', $permission);

                continue;
            }

            $seen[$permission] = true;
            $parsed[] = $permission;
        }

        return [$parsed, $errors];
    }
}
