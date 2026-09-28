<?php

namespace Tests\Feature;

use App\Core\Http\Resources\PaginatedResourceCollection;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_system_status_uses_resource_and_optional_database_probe(): void
    {
        $response = $this->getJson('/api/v1/system/status');
        $response->assertOk()->assertExactJson(['data' => ['status' => 'ok']]);
        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{26}$/', $response->headers->get('X-Request-Id'));

        $this->getJson('/api/v1/system/status?check=database')
            ->assertOk()->assertExactJson(['data' => ['status' => 'ok', 'database' => 'ok']]);
    }

    public function test_invalid_input_returns_field_errors_without_internal_details(): void
    {
        $response = $this->getJson('/api/v1/system/status?check=unknown');

        $response->assertStatus(422)->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonPath('error.message', 'Os dados informados são inválidos.')
            ->assertJsonStructure(['error' => ['details' => ['fields' => ['check']], 'requestId']]);
        $this->assertSame($response->headers->get('X-Request-Id'), $response->json('error.requestId'));
        $this->assertNotSame($response->headers->get('X-Request-Id'), $this->getJson('/api/v1/system/status')->headers->get('X-Request-Id'));
    }

    public function test_api_not_found_is_json_without_intercepting_spa(): void
    {
        $response = $this->get('/api/v1/missing');

        $response->assertNotFound()->assertHeader('content-type', 'application/json')
            ->assertJsonPath('error.code', 'NOT_FOUND')->assertJsonPath('error.details', null);
        $this->assertSame($response->headers->get('X-Request-Id'), $response->json('error.requestId'));
        $this->get('/login')->assertOk()->assertSee('id="app"', false);
        $this->postJson('/api/v1/system/status')->assertStatus(405)->assertJsonPath('error.code', 'METHOD_NOT_ALLOWED');
    }

    public function test_unexpected_error_is_sanitized_and_correlated_with_log(): void
    {
        $requestIdInLog = null;
        $logger = Mockery::mock(LoggerInterface::class);
        $logger->shouldReceive('error')->once()->withArgs(function ($message, $context) use (&$requestIdInLog): bool {
            $requestIdInLog = $context['requestId'] ?? null;

            return str_contains($message, 'internal diagnostic') && $context['exception'] instanceof RuntimeException;
        });
        $this->app->instance(LoggerInterface::class, $logger);

        Route::get('/api/v1/_contract/failure', fn () => throw new RuntimeException('internal diagnostic /private/path SQL secret'));

        $response = $this->getJson('/api/v1/_contract/failure');

        $response->assertStatus(500)->assertJsonPath('error.code', 'INTERNAL_ERROR')
            ->assertJsonPath('error.details', null)->assertDontSee('internal diagnostic')->assertDontSee('SQL secret');
        $this->assertSame($response->headers->get('X-Request-Id'), $response->json('error.requestId'));
        $this->assertSame($requestIdInLog, $response->json('error.requestId'));
    }

    public function test_users_and_session_tables_migrate_in_isolated_mariadb(): void
    {
        $this->assertSame('starterkit_test', DB::getDatabaseName());
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('password_reset_tokens'));
        $this->assertTrue(Schema::hasTable('sessions'));

        DB::table('users')->insert(['name' => 'Pessoa', 'email' => 'person@example.test']);
        $this->assertNull(DB::table('users')->where('email', 'person@example.test')->value('password'));

        $this->expectException(QueryException::class);
        DB::table('users')->insert(['name' => 'Outra', 'email' => 'person@example.test']);
    }

    public function test_paginated_resources_use_camel_case_metadata(): void
    {
        $paginator = new LengthAwarePaginator([new JsonResource(['id' => '21'])], 21, 20, 2, ['path' => 'http://localhost:8080/api/v1/example']);
        $collection = new PaginatedResourceCollection($paginator);

        $response = $collection->toResponse(request());
        $this->assertSame([
            'currentPage' => 2, 'from' => 21, 'lastPage' => 2, 'perPage' => 20, 'to' => 21, 'total' => 21,
        ], $response->getData(true)['meta']);
        $this->assertSame([['id' => '21']], $response->getData(true)['data']);
        $this->assertSame('http://localhost:8080/api/v1/example?page=1', $response->getData(true)['links']['prev']);
    }
}
