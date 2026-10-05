<?php

namespace App\Core\Auth\Ldap;

final class Registry
{
    public static function normalize(string $value): string
    {
        return mb_strtolower(trim($value), 'UTF-8');
    }
}
