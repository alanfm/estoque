<?php

namespace App\Core\Auth\Ldap;

use App\Core\Auth\Exceptions\LdapUnavailableException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use LDAP\Connection;

class LdapAuthenticator
{
    private const CIRCUIT_KEY = 'auth.ldap.circuit-open';

    public function circuitOpen(): bool
    {
        return Cache::has(self::CIRCUIT_KEY);
    }

    public function authenticate(string $registry, string $password): bool
    {
        return $this->bind($registry, $password, false) !== null;
    }

    public function authenticateProfile(string $registry, string $password): ?LdapProfile
    {
        $result = $this->bind($registry, $password, true);

        return $result instanceof LdapProfile ? $result : null;
    }

    private function bind(string $registry, string $password, bool $readProfile): LdapProfile|bool|null
    {
        if ($password === '') {
            return null;
        }
        if (! extension_loaded('ldap')) {
            throw new LdapUnavailableException;
        }

        $config = config('auth.ldap');
        if ($config['ssl'] && $config['tls']) {
            throw new LdapUnavailableException;
        }

        if (Cache::has(self::CIRCUIT_KEY)) {
            throw new LdapUnavailableException;
        }

        $host = (string) $config['host'];
        $port = (int) $config['port'];
        $uri = ($config['ssl'] ? 'ldaps://' : 'ldap://').$host.':'.$port;
        $connection = @ldap_connect($uri);
        if ($connection === false) {
            $this->openCircuit();
            throw new LdapUnavailableException;
        }

        try {
            ldap_set_option($connection, LDAP_OPT_PROTOCOL_VERSION, 3);
            ldap_set_option($connection, LDAP_OPT_NETWORK_TIMEOUT, (int) $config['timeout']);
            ldap_set_option($connection, LDAP_OPT_REFERRALS, 0);
            if (defined('LDAP_OPT_X_TLS_REQUIRE_CERT') && defined('LDAP_OPT_X_TLS_DEMAND')) {
                ldap_set_option($connection, LDAP_OPT_X_TLS_REQUIRE_CERT, LDAP_OPT_X_TLS_DEMAND);
            }

            if ($config['tls'] && ! @ldap_start_tls($connection)) {
                $this->openCircuit();
                throw new LdapUnavailableException;
            }

            $principal = $registry.'@'.ltrim((string) $config['upn_suffix'], '@');
            $bound = @ldap_bind($connection, $principal, $password);
            if ($bound) {
                Cache::forget(self::CIRCUIT_KEY);

                return $readProfile ? $this->readProfile($connection, $principal, $registry, $config) : true;
            }

            $error = ldap_errno($connection);
            if ($error === 49) {
                return null;
            }

            $this->openCircuit();
            throw new LdapUnavailableException;
        } catch (LdapUnavailableException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            $this->openCircuit();
            Log::warning('Falha operacional no provedor LDAP.', ['category' => class_basename($exception)]);
            throw new LdapUnavailableException;
        } finally {
            @ldap_unbind($connection);
        }
    }

    private function readProfile(Connection $connection, string $principal, string $registry, array $config): ?LdapProfile
    {
        if (! is_string($config['base_dn']) || trim($config['base_dn']) === '') {
            throw new LdapUnavailableException;
        }

        $filter = '(&(objectClass=user)(userPrincipalName='.ldap_escape($principal, '', LDAP_ESCAPE_FILTER).'))';
        $result = @ldap_search($connection, $config['base_dn'], $filter, ['displayName', 'cn', 'mail', 'sAMAccountName', 'objectGUID'], 0, 2, (int) $config['timeout']);
        if ($result === false) {
            $this->openCircuit();
            throw new LdapUnavailableException;
        }

        $entries = ldap_get_entries($connection, $result);
        if ($entries === false || $entries['count'] !== 1) {
            return null;
        }
        $entry = $entries[0];
        $name = trim((string) ($entry['displayname'][0] ?? $entry['cn'][0] ?? ''));
        $email = mb_strtolower(trim((string) ($entry['mail'][0] ?? '')));
        $guid = $entry['objectguid'][0] ?? null;
        if ($name === '' || mb_strlen($name) > 255 || strlen($email) > 255 || ! filter_var($email, FILTER_VALIDATE_EMAIL)
            || ! is_string($guid) || strlen($guid) !== 16
            || Registry::normalize((string) ($entry['samaccountname'][0] ?? '')) !== $registry) {
            return null;
        }

        return new LdapProfile($name, $email, bin2hex($guid));
    }

    private function openCircuit(): void
    {
        Cache::put(self::CIRCUIT_KEY, true, 30);
    }
}
