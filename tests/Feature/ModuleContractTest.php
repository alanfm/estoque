<?php

namespace Tests\Feature;

use App\Core\Modules\ModuleDiscovery;
use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleStateStore;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\RefreshDatabaseState;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Starterkit\ContractSample\ContractSampleServiceProvider;
use Tests\TestCase;

class ModuleContractTest extends TestCase
{
    private string $statePath;

    /** @var list<string> */
    private array $temporaryRoots = [];

    protected function setUp(): void
    {
        $this->statePath = sys_get_temp_dir().'/starterkit-modules-'.bin2hex(random_bytes(6)).'.json';

        $this->applyModuleEnvironment();
        parent::setUp();

        $this->app->forgetInstance(ModuleRegistry::class);
        $this->app->register(ContractSampleServiceProvider::class);
    }

    protected function tearDown(): void
    {
        @unlink($this->statePath);
        @unlink($this->statePath.'-direct');

        foreach ($this->temporaryRoots as $root) {
            $this->removeDirectory($root);
        }

        $this->clearModuleEnvironment();
        // This suite runs migrate:fresh with temporary module roots. Make later
        // RefreshDatabase suites rebuild the schema using the normal registry.
        RefreshDatabaseState::$migrated = false;
        parent::tearDown();
    }

    public function test_discovers_local_module_with_provider_and_permission(): void
    {
        $registry = $this->app->make(ModuleRegistry::class);
        $module = $registry->find('contract-sample');

        $this->assertNotNull($module);
        $this->assertTrue($module->enabled);
        $this->assertSame('1.0.0', $module->manifest->version);
        $this->assertContains(ContractSampleServiceProvider::class, $module->providers);
        $this->assertSame([], $module->issues);

        $this->assertContains(
            ['name' => 'contract-sample.viewAny', 'module' => 'contract-sample', 'description' => null],
            $registry->permissionDefinitions(),
        );
    }

    public function test_provider_registers_route_and_migration(): void
    {
        $this->artisan('migrate:fresh')->assertExitCode(0);

        $this->assertTrue(Schema::hasTable('contract_sample_notes'));

        $this->getJson('/api/v1/contract-sample/ping')->assertUnauthorized();

        $this->actingAs($this->superAdmin())
            ->getJson('/api/v1/contract-sample/ping')
            ->assertOk()
            ->assertJsonPath('data.module', 'contract-sample')
            ->assertJsonPath('data.status', 'ok');
    }

    public function test_permission_sync_and_disable_preserve_data_and_assignments(): void
    {
        $this->artisan('migrate:fresh')->assertExitCode(0);
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $permission = Permission::query()->where('name', 'contract-sample.viewAny')->sole();
        $this->assertSame('contract-sample', $permission->module);

        $role = Role::query()->create(['slug' => 'sample-operator', 'name' => 'Operador da Amostra']);
        $role->permissions()->attach($permission);

        DB::table('contract_sample_notes')->insert(['title' => 'Nota preservada']);

        $this->artisan('core:modules:disable', ['name' => 'contract-sample'])->assertExitCode(0);
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $registry = $this->app->make(ModuleRegistry::class);

        $this->assertFalse($registry->find('contract-sample')->enabled);
        $this->assertSame([], $registry->frontendEntries());
        $this->assertNotNull($permission->fresh()->obsolete_at);
        $this->assertSame(1, $role->permissions()->where('permissions.name', 'contract-sample.viewAny')->count());
        $this->assertSame(1, DB::table('contract_sample_notes')->count());

        $this->artisan('core:modules:enable', ['name' => 'contract-sample'])->assertExitCode(0);
        $this->artisan('core:sync-permissions')->assertExitCode(0);

        $this->assertNull($permission->fresh()->obsolete_at);
        $this->assertSame(1, $role->permissions()->where('permissions.name', 'contract-sample.viewAny')->count());
        $this->assertSame(1, DB::table('contract_sample_notes')->count());
    }

    public function test_invalid_manifest_blocks_activation(): void
    {
        $root = $this->temporaryRoot();
        $this->writeModule($root, 'acme', 'bad-permission', $this->manifest('bad-permission', [
            'permissions' => ['other.viewAny'],
        ]));

        $registry = new ModuleRegistry(
            new ModuleDiscovery([$root]),
            new ModuleStateStore($this->statePath.'-direct'),
            coreVersion: '1.0.0-dev.0',
        );

        $this->assertStringContainsString('prefixada', implode("\n", $registry->issues()));
        $this->assertNull($registry->find('bad-permission'));
    }

    public function test_incompatible_version_missing_dependency_and_cycle_block_activation(): void
    {
        $root = $this->temporaryRoot();

        $this->writeModule($root, 'acme', 'wrong-core', $this->manifest('wrong-core', [
            'core' => '^2.0.0',
        ]));
        $this->writeModule($root, 'acme', 'missing-dep', $this->manifest('missing-dep', [
            'dependencies' => [['name' => 'absent', 'version' => '^1.0.0']],
        ]));
        $this->writeModule($root, 'acme', 'cycle-a', $this->manifest('cycle-a', [
            'dependencies' => [['name' => 'cycle-b', 'version' => '^1.0.0']],
        ]));
        $this->writeModule($root, 'acme', 'cycle-b', $this->manifest('cycle-b', [
            'dependencies' => [['name' => 'cycle-a', 'version' => '^1.0.0']],
        ]));

        $registry = new ModuleRegistry(
            new ModuleDiscovery([$root]),
            new ModuleStateStore($this->statePath.'-direct'),
            coreVersion: '1.0.0-dev.0',
        );

        $issues = implode("\n", $registry->issues());

        $this->assertStringContainsString('não satisfaz a faixa', $issues);
        $this->assertStringContainsString('Dependência ausente', $issues);
        $this->assertStringContainsString('circular', $issues);

        foreach (['wrong-core', 'missing-dep', 'cycle-a', 'cycle-b'] as $name) {
            $this->assertNotNull($registry->find($name));
            $this->assertFalse($registry->find($name)->enabled);
        }
    }

    public function test_diagnostics_and_entries_are_available_for_pipelines(): void
    {
        $this->artisan('core:modules:diagnose')->assertExitCode(0);
        $this->artisan('core:modules:diagnose', ['--json' => true])
            ->expectsOutputToContain('contract-sample')
            ->assertExitCode(0);

        $this->artisan('core:modules:entries')
            ->expectsOutputToContain('ContractSample/resources/spa/module.ts')
            ->assertExitCode(0);
    }

    private function applyModuleEnvironment(): void
    {
        $this->setEnvironmentValue('STARTERKIT_MODULE_PATHS', dirname(__DIR__).'/Fixtures/Modules');
        $this->setEnvironmentValue('STARTERKIT_MODULE_STATE', $this->statePath);
    }

    private function clearModuleEnvironment(): void
    {
        foreach (['STARTERKIT_MODULE_PATHS', 'STARTERKIT_MODULE_STATE'] as $key) {
            putenv($key);
            unset($_ENV[$key], $_SERVER[$key]);
        }
    }

    private function setEnvironmentValue(string $key, string $value): void
    {
        putenv($key.'='.$value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }

    private function superAdmin(string $email = 'root@example.test'): User
    {
        $role = Role::query()->firstOrCreate(['slug' => Role::SUPER_ADMIN], ['name' => 'Superadministrador']);
        $user = User::query()->create(['name' => 'Root', 'email' => $email]);
        $user->roles()->attach($role);

        return $user;
    }

    private function temporaryRoot(): string
    {
        $root = sys_get_temp_dir().'/starterkit-modules-'.bin2hex(random_bytes(6));
        mkdir($root, 0o775, true);
        $this->temporaryRoots[] = $root;

        return $root;
    }

    /**
     * @param  array<string, mixed>  $manifest
     */
    private function writeModule(string $root, string $vendor, string $name, array $manifest): void
    {
        $path = $root.'/'.$vendor.'/'.$name;
        mkdir($path.'/src', 0o775, true);

        file_put_contents($path.'/module.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        file_put_contents($path.'/composer.json', json_encode([
            'name' => $vendor.'/'.$name,
            'type' => 'starterkit-module',
            'require' => ['php' => '~8.5.0', 'laravel/framework' => '^13.0'],
            'autoload' => ['psr-4' => ['Fixture\\'.$name.'\\' => 'src/']],
            'extra' => ['laravel' => ['providers' => [Application::class]]],
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function manifest(string $name, array $overrides = []): array
    {
        return array_merge([
            'schemaVersion' => 1,
            'name' => $name,
            'displayName' => ucfirst($name),
            'version' => '1.0.0',
            'core' => '^1.0.0',
            'apiPrefix' => $name,
            'frontendEntry' => 'resources/spa/module.ts',
            'dependencies' => [],
            'permissions' => [$name.'.viewAny'],
        ], $overrides);
    }

    private function removeDirectory(string $path): void
    {
        if (! is_dir($path)) {
            return;
        }

        foreach (scandir($path) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $full = $path.'/'.$entry;

            is_dir($full) ? $this->removeDirectory($full) : @unlink($full);
        }

        @rmdir($path);
    }
}
