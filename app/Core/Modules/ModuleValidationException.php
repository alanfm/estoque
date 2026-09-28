<?php

namespace App\Core\Modules;

use RuntimeException;

final class ModuleValidationException extends RuntimeException
{
    /**
     * @param  list<string>  $errors
     */
    public function __construct(
        public readonly string $module,
        public readonly array $errors,
    ) {
        parent::__construct(sprintf(
            'Manifesto inválido para o módulo "%s": %s',
            $module,
            implode(' ', $errors),
        ));
    }
}
