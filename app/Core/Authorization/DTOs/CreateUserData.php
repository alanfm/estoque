<?php

namespace App\Core\Authorization\DTOs;

use App\Core\Authorization\Http\Requests\StoreUserRequest;

final readonly class CreateUserData
{
    /** @param array<int, string> $roles */
    public function __construct(
        public string $name,
        public string $email,
        public array $roles,
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(
            name: (string) $request->validated('name'),
            email: (string) $request->validated('email'),
            roles: array_values((array) $request->validated('roles', [])),
        );
    }
}
