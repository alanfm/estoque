<?php

namespace App\Core\Modules;

/**
 * Manifesto bruto localizado no disco, ainda não validado.
 */
final class ModuleCandidate
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public readonly string $path,
        public readonly array $data,
    ) {}
}
