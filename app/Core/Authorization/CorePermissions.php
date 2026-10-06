<?php

namespace App\Core\Authorization;

final class CorePermissions
{
    public const MODULE = 'core';

    /**
     * @return array<int, array{name: string, module: string, description: string}>
     */
    public static function definitions(): array
    {
        return array_map(
            static fn (string $name, string $description): array => [
                'name' => $name,
                'module' => self::MODULE,
                'description' => $description,
            ],
            array_keys(self::catalog()),
            array_values(self::catalog()),
        );
    }

    /** @return array<int, string> */
    public static function names(): array
    {
        return array_keys(self::catalog());
    }

    /** @return array<string, string> */
    private static function catalog(): array
    {
        return [
            'modules.viewAny' => 'Listar módulos instalados',
            'modules.install' => 'Instalar módulos do GitHub',
            'modules.remove' => 'Remover módulos',
            'modules.enable' => 'Habilitar módulos',
            'modules.disable' => 'Desabilitar módulos',
            'users.viewAny' => 'Listar usuários',
            'users.view' => 'Visualizar usuário',
            'users.create' => 'Criar usuário',
            'users.update' => 'Editar usuário e atribuir papéis',
            'users.delete' => 'Excluir usuário',
            'roles.viewAny' => 'Listar papéis',
            'roles.view' => 'Visualizar papel',
            'roles.create' => 'Criar papel',
            'roles.update' => 'Editar papel e suas permissões',
            'roles.delete' => 'Excluir papel',
            'permissions.viewAny' => 'Listar o catálogo de permissões',
        ];
    }
}
