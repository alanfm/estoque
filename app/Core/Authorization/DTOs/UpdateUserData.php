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
        public ?string $registry = null,
        public ?bool $ldapEnabled = null,
        public ?bool $localAuthEnabled = null,
        public bool $registryProvided = false,
    ) {}

    public static function fromRequest(UpdateUserRequest $request): self
    {
        return new self(
            name: $request->has('name') ? (string) $request->validated('name') : null,
            email: $request->has('email') ? (string) $request->validated('email') : null,
            roles: $request->has('roles') ? array_values((array) $request->validated('roles')) : null,
            registry: $request->has('registry') ? $request->validated('registry') : null,
            ldapEnabled: $request->has('ldapEnabled') ? (bool) $request->validated('ldapEnabled') : null,
            localAuthEnabled: $request->has('localAuthEnabled') ? (bool) $request->validated('localAuthEnabled') : null,
            registryProvided: $request->has('registry'),
        );
    }
}
