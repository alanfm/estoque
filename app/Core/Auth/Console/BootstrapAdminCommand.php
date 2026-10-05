<?php

namespace App\Core\Auth\Console;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

final class BootstrapAdminCommand extends Command
{
    protected $signature = 'core:bootstrap-admin {registry : Matrícula do primeiro administrador} {name : Nome do administrador} {email : E-mail de contato do administrador}';

    protected $description = 'Provisiona o primeiro administrador sem credencial padrão';

    public function handle(): int
    {
        $registry = mb_strtolower(trim((string) $this->argument('registry')));
        $email = mb_strtolower(trim((string) $this->argument('email')));
        $name = trim((string) $this->argument('name'));

        $admin = User::whereHas('roles', fn ($query) => $query->where('slug', Role::SUPER_ADMIN))->first();

        if ($admin !== null) {
            if ($admin->email === $email && $admin->registry === $registry) {
                $this->components->info('Administrador inicial já provisionado. Nenhuma alteração foi feita.');

                return self::SUCCESS;
            }

            $this->components->error('Já existe um administrador inicial.');

            return self::FAILURE;
        }

        if (User::query()->exists()) {
            $this->components->error('Há usuários sem administrador inicial; resolva manualmente antes de continuar.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Senha inicial (não exibida)');
        $confirmation = (string) $this->secret('Confirme a senha inicial');
        $validator = Validator::make(compact('registry', 'email', 'name', 'password', 'confirmation'), [
            'registry' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9._-]+$/', 'unique:users,registry'],
            'email' => ['required', 'email', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', Password::min(12), 'same:confirmation'],
        ]);

        if ($validator->fails()) {
            $this->components->error('Dados ou senha inválidos. Verifique a matrícula, o e-mail e use pelo menos 12 caracteres.');

            return self::FAILURE;
        }

        DB::transaction(function () use ($name, $email, $registry, $password): void {
            $role = Role::firstOrCreate(['slug' => Role::SUPER_ADMIN], ['name' => 'Superadministrador']);
            $user = new User(['name' => $name, 'email' => $email, 'registry' => $registry]);
            $user->password = Hash::make($password);
            $user->save();
            $user->roles()->attach($role);
        });

        $this->components->info('Administrador inicial provisionado.');

        return self::SUCCESS;
    }
}
