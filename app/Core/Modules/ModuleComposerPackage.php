<?php

namespace App\Core\Modules;

use App\Core\Modules\Support\VersionRange;
use JsonException;

/**
 * Inspeciona o `composer.json` de um módulo e seus providers descobertos.
 */
final class ModuleComposerPackage
{
    /**
     * @return array{providers: list<class-string>, issues: list<string>}
     */
    public function inspect(string $modulePath, string $phpVersion, string $laravelVersion): array
    {
        $issues = [];
        $providers = [];
        $composerPath = rtrim($modulePath, '/').'/composer.json';

        if (! is_file($composerPath)) {
            return ['providers' => [], 'issues' => ['composer.json ausente.']];
        }

        try {
            $composer = json_decode((string) file_get_contents($composerPath), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            return ['providers' => [], 'issues' => ['composer.json inválido: '.$exception->getMessage()]];
        }

        if (! is_array($composer)) {
            return ['providers' => [], 'issues' => ['composer.json deve conter um objeto JSON.']];
        }

        $name = $composer['name'] ?? null;
        if (! is_string($name) || ! preg_match('/^[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9](([_.]?|-{0,2})[a-z0-9]+)*$/', $name)) {
            $issues[] = 'composer.json deve declarar "name" no formato vendor/package.';
        }

        if (($composer['type'] ?? null) !== 'starterkit-module') {
            $issues[] = 'composer.json deve declarar "type": "starterkit-module".';
        }

        $require = is_array($composer['require'] ?? null) ? $composer['require'] : [];
        $issues = [...$issues, ...$this->checkPlatformRequirements($require, $phpVersion, $laravelVersion)];

        if (! is_array($composer['autoload']['psr-4'] ?? null) || $composer['autoload']['psr-4'] === []) {
            $issues[] = 'composer.json deve declarar autoload PSR-4.';
        }

        $declared = $composer['extra']['laravel']['providers'] ?? null;
        if (! is_array($declared) || $declared === []) {
            $issues[] = 'composer.json deve declarar extra.laravel.providers.';
        } else {
            foreach ($declared as $provider) {
                if (! is_string($provider) || ! class_exists($provider)) {
                    $issues[] = sprintf('Service Provider "%s" não pôde ser carregado.', is_string($provider) ? $provider : '(inválido)');

                    continue;
                }

                $providers[] = $provider;
            }
        }

        return ['providers' => $providers, 'issues' => $issues];
    }

    /**
     * @param  array<string, mixed>  $require
     * @return list<string>
     */
    private function checkPlatformRequirements(array $require, string $phpVersion, string $laravelVersion): array
    {
        $issues = [];

        $phpConstraint = $require['php'] ?? null;
        if (! is_string($phpConstraint)) {
            $issues[] = 'composer.json deve declarar o requisito "php".';
        } elseif (! VersionRange::satisfies($phpVersion, $phpConstraint)) {
            $issues[] = sprintf('PHP %s não satisfaz o requisito "%s".', $phpVersion, $phpConstraint);
        }

        $laravelConstraint = $require['laravel/framework'] ?? null;
        if (! is_string($laravelConstraint)) {
            $issues[] = 'composer.json deve declarar o requisito "laravel/framework".';
        } elseif (! VersionRange::satisfies($laravelVersion, $laravelConstraint)) {
            $issues[] = sprintf('Laravel %s não satisfaz o requisito "%s".', $laravelVersion, $laravelConstraint);
        }

        return $issues;
    }
}
