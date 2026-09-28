<?php

namespace App\Core\Authorization\Exceptions;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ProtectedRoleException extends ConflictHttpException
{
    public static function make(): self
    {
        return new self('O papel de superadministrador é protegido pelo núcleo.');
    }
}
