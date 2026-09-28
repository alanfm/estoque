<?php

namespace App\Core\Authorization\DTOs;

use App\Core\Authorization\Http\Requests\UpdateUserRequest;

final readonly class UpdateUserData
{
    /** @param array<int, string>|null $roles */
    public function __construct(
        public ?string $name,
        public ?string $email,
        public ?array $roles,
    ) {}

    public static function fromRequest(UpdateUserRequest $request): self
    {
        return new self(
            name: $request->has('name') ? (string) $request->validated('name') : null,
            email: $request->has('email') ? (string) $request->validated('email') : null,
            roles: $request->has('roles') ? array_values((array) $request->validated('roles')) : null,
        );
    }
}
