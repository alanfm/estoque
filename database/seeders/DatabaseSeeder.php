<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::query()->firstOrCreate(
            ['slug' => Role::SUPER_ADMIN],
            ['name' => 'Superadministrador'],
        );

        $user = User::query()->firstOrNew(['email' => 'admin@example.com']);
        $user->name = 'Administrador de Teste';
        $user->password = Hash::make('password');
        $user->save();

        $user->roles()->syncWithoutDetaching([$role->getKey()]);
    }
}
