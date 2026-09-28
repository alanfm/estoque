<?php

namespace Tests\Unit;

use App\Core\Modules\Support\VersionRange;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class VersionRangeTest extends TestCase
{
    #[DataProvider('satisfactionCases')]
    public function test_it_evaluates_semantic_ranges(string $version, string $constraint, bool $expected): void
    {
        $this->assertSame($expected, VersionRange::satisfies($version, $constraint));
    }

    /** @return array<string, array{string, string, bool}> */
    public static function satisfactionCases(): array
    {
        return [
            'caret within major' => ['1.4.2', '^1.2.0', true],
            'caret below minimum' => ['1.1.9', '^1.2.0', false],
            'caret blocks next major' => ['2.0.0', '^1.2.0', false],
            'disjunction accepts second' => ['2.0.0', '^1.2.0 || ^2.0.0', true],
            'tilde keeps minor' => ['1.2.9', '~1.2.0', true],
            'tilde blocks next minor' => ['1.3.0', '~1.2.0', false],
            'gt operator' => ['2.0.0', '>1.9.9', true],
            'lte operator' => ['2.0.0', '<=2.0.0', true],
            'wildcard' => ['9.9.9', '*', true],
            'prerelease core matches' => ['1.0.0-dev.0', '^1.0.0', true],
            'two part caret' => ['13.17.0', '^13.0', true],
        ];
    }

    public function test_it_validates_constraints(): void
    {
        $this->assertTrue(VersionRange::isValid('^1.0.0'));
        $this->assertTrue(VersionRange::isValid('^1.2.0 || ^2.0.0'));
        $this->assertFalse(VersionRange::isValid('banana'));
        $this->assertFalse(VersionRange::isValid('^'));
    }
}
