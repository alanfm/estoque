<?php

namespace App\Core\Modules\Support;

/**
 * Compara versões semânticas com as faixas aceitas nos manifestos.
 *
 * A comparação ignora pré-lançamentos de propósito: enquanto o núcleo declara
 * `1.0.0-dev.0`, faixas como `^1.0.0` continuam satisfeitas.
 */
final class VersionRange
{
    public static function satisfies(string $version, string $constraint): bool
    {
        foreach (self::groups($constraint) as $group) {
            if ($group !== '' && self::satisfiesGroup($version, $group)) {
                return true;
            }
        }

        return false;
    }

    public static function isValid(string $constraint): bool
    {
        $groups = self::groups($constraint);

        if ($groups === []) {
            return false;
        }

        foreach ($groups as $group) {
            if ($group === '') {
                return false;
            }

            foreach (preg_split('/\s+/', $group) ?: [] as $part) {
                if (! self::isValidPart($part)) {
                    return false;
                }
            }
        }

        return true;
    }

    /** @return array{int, int, int} */
    public static function parse(string $version): array
    {
        if (! preg_match('/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-[0-9A-Za-z.\-]+)?(?:\+[0-9A-Za-z.\-]+)?$/', trim($version), $matches)) {
            return [0, 0, 0];
        }

        return [
            (int) $matches[1],
            (int) ($matches[2] ?? 0),
            (int) ($matches[3] ?? 0),
        ];
    }

    /** @return list<string> */
    private static function groups(string $constraint): array
    {
        return array_map('trim', preg_split('/\s*\|\|\s*/', trim($constraint)) ?: []);
    }

    private static function satisfiesGroup(string $version, string $group): bool
    {
        foreach (preg_split('/\s+/', trim($group)) ?: [] as $part) {
            if ($part === '') {
                continue;
            }

            if (! self::satisfiesPart($version, $part)) {
                return false;
            }
        }

        return true;
    }

    private static function satisfiesPart(string $version, string $part): bool
    {
        $part = trim($part);

        if ($part === '' || $part === '*') {
            return true;
        }

        $operator = '=';
        $number = $part;

        foreach (['>=', '<=', '^', '~', '>', '<', '='] as $candidate) {
            if (str_starts_with($part, $candidate)) {
                $operator = $candidate;
                $number = substr($part, strlen($candidate));
                break;
            }
        }

        $base = self::parse($number);
        $target = self::parse($version);

        return match ($operator) {
            '^' => ! self::less($target, $base) && self::less($target, self::caretUpperBound($base)),
            '~' => ! self::less($target, $base) && self::less($target, self::tildeUpperBound($number, $base)),
            '>=' => ! self::less($target, $base),
            '<=' => ! self::less($base, $target),
            '>' => self::less($base, $target),
            '<' => self::less($target, $base),
            default => $target === $base,
        };
    }

    private static function isValidPart(string $part): bool
    {
        $part = trim($part);

        if ($part === '*' || $part === '') {
            return true;
        }

        if (! preg_match('/^(?:\^|~|>=|<=|>|<|=)?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/', $part, $matches)) {
            return false;
        }

        return (int) $matches[1] >= 0;
    }

    /**
     * @param  array{int, int, int}  $base
     * @return array{int, int, int}
     */
    private static function caretUpperBound(array $base): array
    {
        [$major, $minor, $patch] = $base;

        if ($major > 0) {
            return [$major + 1, 0, 0];
        }

        if ($minor > 0) {
            return [0, $minor + 1, 0];
        }

        return [0, 0, $patch + 1];
    }

    /**
     * @param  array{int, int, int}  $base
     * @return array{int, int, int}
     */
    private static function tildeUpperBound(string $number, array $base): array
    {
        [$major, $minor] = $base;
        $parts = substr_count(trim($number), '.') + 1;

        return $parts >= 2
            ? [$major, $minor + 1, 0]
            : [$major + 1, 0, 0];
    }

    /**
     * @param  array{int, int, int}  $left
     * @param  array{int, int, int}  $right
     */
    private static function less(array $left, array $right): bool
    {
        foreach ([0, 1, 2] as $index) {
            if ($left[$index] !== $right[$index]) {
                return $left[$index] < $right[$index];
            }
        }

        return false;
    }
}
