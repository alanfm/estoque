<?php

namespace App\Core\Authorization\DTOs;

use App\Core\Authorization\Http\Requests\UpdateRoleRequest;

final readonly class UpdateRoleData
{
    /** @param array<int, string>|null $permissions */
    public function __construct(
        public ?string $name,
        public ?array $permissions,
    ) {}

    public static function fromRequest(UpdateRoleRequest $request): self
    {
        return new self(
            name: $request->has('name') ? (string) $request->validated('name') : null,
            permissions: $request->has('permissions') ? array_values((array) $request->validated('permissions')) : null,
        );
    }
}
