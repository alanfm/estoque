<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use RuntimeException;

final class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Usuários de teste só podem ser criados em local ou testing.');
        }

        DB::transaction(function (): void {
            $users = [
                ['name' => 'Administrador de teste', 'email' => 'admin@example.test', 'registry' => '123456'],
                ['name' => 'Usuário de teste', 'email' => 'user@example.test', 'registry' => '654321'],
            ];
            foreach ($users as $attributes) {
                if (User::query()->where('email', $attributes['email'])->exists()) {
                    continue;
                }

                $user = new User($attributes);
                $user->password = Hash::make('Teste@12345678');
                $user->save();

                if ($attributes['email'] === 'admin@example.test') {
                    $role = Role::query()->firstOrCreate(
                        ['slug' => Role::SUPER_ADMIN],
                        ['name' => 'Superadministrador'],
                    );
                    $user->roles()->attach($role);
                }
            }
        });
    }
}
