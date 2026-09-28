<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_spa_and_health_respond_without_capturing_api_routes(): void
    {
        $this->get('/')->assertOk()->assertSee('id="app"', false);
        $this->get('/example/page')->assertOk()->assertSee('id="app"', false);
        $this->get('/up')->assertOk();
        $this->getJson('/api/v1/missing')->assertNotFound()->assertHeader('content-type', 'application/json');
    }

    public function test_migrations_and_writes_use_isolated_mariadb_database(): void
    {
        $this->assertSame('mysql', DB::getDriverName());
        $this->assertSame('starterkit_test', DB::getDatabaseName());

        DB::table('installation_probes')->insert(['label' => 'mariadb']);

        $this->assertSame(1, DB::table('installation_probes')->where('label', 'mariadb')->count());
    }
}
