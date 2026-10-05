<?php

namespace App\Core\Auth\Ldap;

final readonly class LdapProfile
{
    public function __construct(
        public string $name,
        public string $email,
        public string $objectId,
    ) {}
}
