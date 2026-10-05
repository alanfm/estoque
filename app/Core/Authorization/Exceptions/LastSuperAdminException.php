<?php

namespace App\Core\Authorization\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class LastSuperAdminException extends ConflictHttpException
{
    public static function make(): self
    {
        return new self('O último superadministrador com acesso local não pode ser removido.');
    }
}
