<?php

namespace App\Core\Authorization\DTOs;

use App\Core\Authorization\Http\Requests\StoreRoleRequest;

final readonly class CreateRoleData
{
    /** @param array<int, string> $permissions */
    public function __construct(
        public string $slug,
        public string $name,
        public array $permissions,
    ) {}

    public static function fromRequest(StoreRoleRequest $request): self
    {
        return new self(
            slug: (string) $request->validated('slug'),
            name: (string) $request->validated('name'),
            permissions: array_values((array) $request->validated('permissions', [])),
        );
    }
}
