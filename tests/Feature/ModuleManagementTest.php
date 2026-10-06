<?php

namespace Tests\Feature;

use App\Core\Modules\Actions\CheckModuleCompatibilityAction;
use App\Core\Modules\ModuleDiscovery;
use App\Core\Modules\ModuleRegistry;
use App\Core\Modules\ModuleStateStore;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ModuleManagementTest extends TestCase
{
    use RefreshDatabase;

    private string $temporary;

    private ModuleRegistry $registry;

    private ModuleStateStore $state;

    protected function setUp(): void
    {
        parent::setUp();
        $this->temporary = sys_get_temp_dir().'/module-management-'.bin2hex(random_bytes(6));
        File::ensureDirectoryExists($this->temporary);
        $this->state = new ModuleStateStore($this->temporary.'/state.json');
        $this->registry = new ModuleRegistry(new ModuleDiscovery([base_path('modules')]), $this->state, coreVersion: '1.1.0', laravelVersion: app()->version());
        $this->app->instance(ModuleRegistry::class, $this->registry);
        $this->app->instance(ModuleStateStore::class, $this->state);
        config(['modules.state_path' => $this->temporary.'/state.json', 'modules.management_enabled' => true]);
        Process::fake();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->temporary);
        parent::tearDown();
    }

    public function test_all_operations_require_authentication_and_permission(): void
    {
        $operations = [['GET', '/'], ['POST', '/'], ['POST', '/inventory/enable'], ['POST', '/inventory/disable'], ['DELETE', '/inventory']];
        foreach ($operations as [$method, $path]) {
            $this->json($method, '/api/v1/admin/modules'.rtrim($path, '/'))->assertUnauthorized();
        }
        $this->actingAs(User::query()->create(['name' => 'Teste', 'email' => bin2hex(random_bytes(6)).'@example.test']));
        foreach ($operations as [$method, $path]) {
            $this->json($method, '/api/v1/admin/modules'.rtrim($path, '/'))->assertForbidden();
        }
        Process::assertNothingRan();
    }

    public function test_lists_modules_without_exposing_filesystem_paths(): void
    {
        $this->actingAs($this->admin())->getJson('/api/v1/admin/modules')->assertOk()
            ->assertJsonPath('data.0.name', 'inventory')->assertJsonPath('data.0.enabled', true)
            ->assertJsonMissingPath('data.0.path')->assertJsonPath('meta.coreVersion', '1.1.0');
    }

    public function test_disable_preserves_package_and_builds_assets(): void
    {
        $this->actingAs($this->admin())->postJson('/api/v1/admin/modules/inventory/disable')->assertNoContent();
        $this->assertFalse($this->state->isEnabled('inventory'));
        $this->assertFileExists(base_path('modules/acme/inventory/module.json'));
        Process::assertRan(fn ($process) => $process->command === ['npm', 'run', 'build']);
        Process::assertRan(fn ($process) => $process->command === [PHP_BINARY, 'artisan', 'core:sync-permissions']);
    }

    public function test_enable_validates_before_migrations_and_build(): void
    {
        $this->state->disable('inventory');
        $this->actingAs($this->admin())->postJson('/api/v1/admin/modules/inventory/enable')->assertNoContent();
        Process::assertRan(fn ($process) => $process->command === [PHP_BINARY, 'artisan', 'core:modules:validate', 'inventory']);
        Process::assertRan(fn ($process) => $process->command === [PHP_BINARY, 'artisan', 'core:modules:enable', 'inventory']);
        Process::assertRan(fn ($process) => $process->command === [PHP_BINARY, 'artisan', 'migrate', '--force']);
        Process::assertRan(fn ($process) => $process->command === ['npm', 'run', 'build']);
    }

    public function test_validate_command_does_not_activate_module(): void
    {
        $this->state->disable('inventory');
        $this->artisan('core:modules:validate', ['name' => 'inventory'])->assertExitCode(0);
        $this->assertFalse($this->state->isEnabled('inventory'));
        $this->artisan('core:modules:validate', ['name' => 'absent'])->assertExitCode(1);
    }

    public function test_failure_restores_state_and_attempts_recovery_build(): void
    {
        $builds = Process::sequence()->push(Process::result(exitCode: 1))->push(Process::result());
        Process::fake(fn ($process) => $process->command === ['npm', 'run', 'build']
            ? $builds
            : Process::result());
        $this->actingAs($this->admin())->postJson('/api/v1/admin/modules/inventory/disable')->assertUnprocessable();
        $this->assertTrue($this->state->isEnabled('inventory'));
        Process::assertRanTimes(fn ($process) => $process->command === ['npm', 'run', 'build'], times: 2);
    }

    public function test_immutable_host_rejects_mutation_without_running_commands(): void
    {
        config(['modules.management_enabled' => false]);
        $this->actingAs($this->admin())->postJson('/api/v1/admin/modules/inventory/disable')->assertUnprocessable();
        Process::assertNothingRan();
    }

    public function test_rejects_non_github_urls_before_download(): void
    {
        $this->actingAs($this->admin());
        foreach (['http://github.com/acme/test', 'https://github.com.evil.test/acme/test', 'https://github.com/acme/test?command=x', 'https://github.com/acme/..', 'https://user@github.com/acme/test', 'https://github.com/acme/test/tree/main'] as $url) {
            $this->postJson('/api/v1/admin/modules', ['repository' => $url])->assertUnprocessable();
        }
        Process::assertNothingRan();
    }

    public function test_unknown_module_is_not_found(): void
    {
        $this->actingAs($this->admin())->deleteJson('/api/v1/admin/modules/absent')->assertNotFound();
        Process::assertNothingRan();
    }

    public function test_checks_compatible_source_without_loading_provider(): void
    {
        $path = $this->candidate();
        $manifest = (new CheckModuleCompatibilityAction($this->registry))->execute($path);
        $this->assertSame('example', $manifest->name);
        Process::assertNothingRan();
    }

    public function test_incompatible_source_blocks_installation(): void
    {
        $path = $this->candidate(['core' => '^99.0', 'dependencies' => [['name' => 'absent', 'version' => '^1.0']]]);
        try {
            (new CheckModuleCompatibilityAction($this->registry))->execute($path);
            $this->fail('Incompatibilidade deveria impedir instalação.');
        } catch (ValidationException $exception) {
            $this->assertCount(2, $exception->errors()['repository']);
        }
        Process::assertNothingRan();
    }

    public function test_active_dependents_block_disable_and_removal(): void
    {
        $root = $this->temporary.'/modules';
        $path = $root.'/acme/dependent';
        File::ensureDirectoryExists($path);
        $data = json_decode(File::get(base_path('modules/acme/inventory/module.json')), true);
        $data['name'] = 'dependent';
        $data['apiPrefix'] = 'dependent';
        $data['permissions'] = ['dependent.viewAny'];
        $data['dependencies'] = [['name' => 'inventory', 'version' => '^1.0']];
        File::put($path.'/module.json', json_encode($data));
        File::copy(base_path('modules/acme/inventory/composer.json'), $path.'/composer.json');
        $registry = new ModuleRegistry(new ModuleDiscovery([base_path('modules'), $root]), $this->state, coreVersion: '1.1.0', laravelVersion: app()->version());
        $this->app->instance(ModuleRegistry::class, $registry);
        $this->actingAs($this->admin());
        $this->postJson('/api/v1/admin/modules/inventory/disable')->assertUnprocessable();
        $this->deleteJson('/api/v1/admin/modules/inventory')->assertUnprocessable();
        $this->assertTrue($this->state->isEnabled('inventory'));
        Process::assertNothingRan();
    }

    public function test_installs_disabled_after_preflight_and_composer_solver(): void
    {
        $candidate = $this->candidate();
        $originalBase = base_path();
        $host = $this->temporary.'/host';
        File::ensureDirectoryExists($host);
        File::put($host.'/composer.json', json_encode(['require' => [], 'repositories' => [['type' => 'path', 'url' => 'modules/*/*']]]));
        $this->app->setBasePath($host);
        try {
            Process::fake(function ($process) use ($candidate) {
                if ($process->command[0] === 'git') {
                    File::copyDirectory($candidate, $process->command[count($process->command) - 1]);
                }

                return Process::result();
            });
            $this->actingAs($this->admin())->postJson('/api/v1/admin/modules', ['repository' => 'https://github.com/acme/example'])->assertNoContent();
            $this->assertFileExists($host.'/modules/acme/example/module.json');
            $this->assertFalse($this->state->isEnabled('example'));
            Process::assertRan(fn ($process) => $process->command === ['composer', 'require', 'acme/example:1.1.0', '--dry-run', '--no-interaction', '--no-scripts', '--no-plugins']);
            Process::assertRan(fn ($process) => $process->command === ['composer', 'require', 'acme/example:1.1.0', '--no-interaction', '--no-scripts', '--no-plugins']);
        } finally {
            $this->app->setBasePath($originalBase);
        }
    }

    public function test_rejects_incompatible_download_without_installing_composer_package(): void
    {
        $candidate = $this->candidate(['core' => '^99.0']);
        Process::fake(function ($process) use ($candidate) {
            if ($process->command[0] === 'git') {
                File::copyDirectory($candidate, $process->command[count($process->command) - 1]);
            }

            return Process::result();
        });
        $this->actingAs($this->admin())->postJson('/api/v1/admin/modules', ['repository' => 'https://github.com/acme/example'])->assertUnprocessable()->assertJsonStructure(['error' => ['details' => ['fields' => ['repository']]]]);
        Process::assertNotRan(fn ($process) => $process->command[0] === 'composer');
        $this->assertFileDoesNotExist(base_path('modules/acme/example/module.json'));
    }

    public function test_removes_package_but_preserves_database_data(): void
    {
        $originalBase = base_path();
        $host = $this->temporary.'/host';
        File::ensureDirectoryExists($host.'/modules/acme');
        File::copyDirectory($originalBase.'/modules/acme/inventory', $host.'/modules/acme/inventory');
        File::put($host.'/composer.json', json_encode(['require' => ['acme/inventory' => '^1.0']]));
        $this->app->setBasePath($host);
        $registry = new ModuleRegistry(new ModuleDiscovery([$host.'/modules']), $this->state, coreVersion: '1.1.0', laravelVersion: app()->version());
        $this->app->instance(ModuleRegistry::class, $registry);
        try {
            DB::table('inventory_categories')->insert(['name' => 'Preservado', 'normalized_name' => 'preservado', 'created_at' => now(), 'updated_at' => now()]);
            $this->actingAs($this->admin())->deleteJson('/api/v1/admin/modules/inventory')->assertNoContent();
            $this->assertDirectoryDoesNotExist($host.'/modules/acme/inventory');
            $this->assertDatabaseHas('inventory_categories', ['name' => 'Preservado']);
            Process::assertRan(fn ($process) => $process->command === ['composer', 'remove', 'acme/inventory', '--no-interaction', '--no-scripts', '--no-plugins']);
        } finally {
            $this->app->setBasePath($originalBase);
        }
    }

    /** @param array<string, mixed> $overrides */
    private function candidate(array $overrides = []): string
    {
        $path = $this->temporary.'/candidate';
        File::ensureDirectoryExists($path.'/resources/spa');
        $data = json_decode(File::get(base_path('modules/acme/inventory/module.json')), true);
        $data = array_replace($data, ['name' => 'example', 'version' => '1.1.0', 'apiPrefix' => 'example', 'permissions' => ['example.viewAny']], $overrides);
        File::put($path.'/module.json', json_encode($data));
        File::put($path.'/resources/spa/module.ts', 'export default {};');
        $composer = json_decode(File::get(base_path('modules/acme/inventory/composer.json')), true);
        $composer['name'] = 'acme/example';
        $composer['version'] = $data['version'];
        $composer['extra']['laravel']['providers'] = ['Unknown\\ExampleServiceProvider'];
        File::put($path.'/composer.json', json_encode($composer));

        return $path;
    }

    private function admin(): User
    {
        $user = User::query()->create(['name' => 'Teste', 'email' => bin2hex(random_bytes(6)).'@example.test']);
        $role = Role::query()->firstOrCreate(['slug' => Role::SUPER_ADMIN], ['name' => 'Superadministrador']);
        $user->roles()->attach($role);

        return $user;
    }
}
