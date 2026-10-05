<?php

namespace Tests\Fixtures\Ldap;

use App\Core\Auth\Exceptions\LdapUnavailableException;
use App\Core\Auth\Ldap\LdapAuthenticator;
use App\Core\Auth\Ldap\LdapProfile;

final class FakeLdapAuthenticator extends LdapAuthenticator
{
    public int $calls = 0;

    public function __construct(private ?LdapProfile $profile, private bool $unavailable = false) {}

    public function circuitOpen(): bool
    {
        return false;
    }

    public function authenticate(string $registry, string $password): bool
    {
        return $this->authenticateProfile($registry, $password) !== null;
    }

    public function authenticateProfile(string $registry, string $password): ?LdapProfile
    {
        $this->calls++;
        if ($this->unavailable) {
            throw new LdapUnavailableException;
        }

        return $this->profile;
    }
}
