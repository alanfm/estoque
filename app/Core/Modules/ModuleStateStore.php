<?php

namespace App\Core\Modules;

use JsonException;

/**
 * Persiste o estado de habilitação fora do banco para leitura segura no boot.
 */
final class ModuleStateStore
{
    public function __construct(private readonly string $path) {}

    /**
     * @return list<string>
     */
    public function disabled(): array
    {
        if (! is_file($this->path)) {
            return [];
        }

        try {
            $data = json_decode((string) file_get_contents($this->path), true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return [];
        }

        $disabled = is_array($data['disabled'] ?? null) ? $data['disabled'] : [];

        return array_values(array_unique(array_filter(
            $disabled,
            static fn (mixed $name): bool => is_string($name) && $name !== '',
        )));
    }

    public function isEnabled(string $name): bool
    {
        return ! in_array($name, $this->disabled(), true);
    }

    public function enable(string $name): void
    {
        $this->persist(array_values(array_filter(
            $this->disabled(),
            static fn (string $disabled): bool => $disabled !== $name,
        )));
    }

    public function disable(string $name): void
    {
        $disabled = $this->disabled();

        if (! in_array($name, $disabled, true)) {
            $disabled[] = $name;
        }

        sort($disabled);

        $this->persist($disabled);
    }

    /**
     * @param  list<string>  $disabled
     */
    private function persist(array $disabled): void
    {
        $directory = dirname($this->path);

        if (! is_dir($directory)) {
            mkdir($directory, 0o775, true);
        }

        file_put_contents(
            $this->path,
            json_encode(['disabled' => $disabled], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n",
        );
    }
}
