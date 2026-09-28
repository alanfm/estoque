<?php

namespace App\Core\Modules;

use JsonException;

/**
 * Descobre módulos instalados sob as raízes configuradas.
 *
 * Cada raiz é varrida em busca de `*\/\*\/module.json`, o que cobre pacotes
 * locais em `modules/vendor/name`. Quando o pacote é instalado pelo Composer,
 * o Service Provider é descoberto automaticamente via `extra.laravel.providers`.
 */
final class ModuleDiscovery
{
    /**
     * @param  list<string>  $roots
     */
    public function __construct(private readonly array $roots) {}

    /**
     * @return array{list<ModuleCandidate>, list<string>}
     */
    public function discover(): array
    {
        $candidates = [];
        $issues = [];

        foreach ($this->roots as $root) {
            if (! is_dir($root)) {
                continue;
            }

            foreach (glob(rtrim($root, '/').'/*/*/module.json') ?: [] as $manifestPath) {
                try {
                    $data = json_decode((string) file_get_contents($manifestPath), true, flags: JSON_THROW_ON_ERROR);
                } catch (JsonException $exception) {
                    $issues[] = sprintf('Manifesto inválido em %s: %s', $manifestPath, $exception->getMessage());

                    continue;
                }

                if (! is_array($data)) {
                    $issues[] = sprintf('Manifesto inválido em %s: o conteúdo deve ser um objeto JSON.', $manifestPath);

                    continue;
                }

                $candidates[] = new ModuleCandidate(dirname($manifestPath), $data);
            }
        }

        usort(
            $candidates,
            static fn (ModuleCandidate $left, ModuleCandidate $right): int => strcmp(
                (string) ($left->data['name'] ?? $left->path),
                (string) ($right->data['name'] ?? $right->path),
            ),
        );

        return [$candidates, $issues];
    }
}
