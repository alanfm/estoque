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
        public ?string $registry = null,
        public bool $ldapEnabled = false,
        public bool $localAuthEnabled = true,
    ) {}

    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(
            name: (string) $request->validated('name'),
            email: (string) $request->validated('email'),
            roles: array_values((array) $request->validated('roles', [])),
            registry: $request->validated('registry'),
            ldapEnabled: (bool) $request->validated('ldapEnabled', false),
            localAuthEnabled: (bool) $request->validated('localAuthEnabled', true),
        );
    }
}
