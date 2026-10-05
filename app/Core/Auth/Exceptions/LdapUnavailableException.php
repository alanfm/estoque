<?php

namespace App\Core\Auth\Exceptions;

use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class LdapUnavailableException extends ServiceUnavailableHttpException
{
    public function __construct()
    {
        parent::__construct(30, 'O serviço de autenticação institucional está temporariamente indisponível.');
    }
}
