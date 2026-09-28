<?php

namespace App\Core\Modules;

final class ModuleDescriptor
{
    /**
     * @param  list<string>  $issues
     * @param  list<class-string>  $providers
     */
    public function __construct(
        public readonly ModuleManifest $manifest,
        public readonly string $path,
        public readonly bool $enabled,
        public readonly array $issues = [],
        public readonly array $providers = [],
    ) {}

    public function frontendEntryPath(): string
    {
        return rtrim($this->path, '/').'/'.$this->manifest->frontendEntry;
    }

    public function isActive(): bool
    {
        return $this->enabled;
    }
}
