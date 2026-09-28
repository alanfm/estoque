<?php

$paths = (string) env('STARTERKIT_MODULE_PATHS', base_path('modules'));

return [
    /*
    |--------------------------------------------------------------------------
    | Versão do núcleo
    |--------------------------------------------------------------------------
    |
    | Usada para validar a faixa `core` declarada em cada module.json. A versão
    | estável é publicada após a validação dos contratos na F7.
    |
    */
    'core_version' => (string) env('STARTERKIT_VERSION', '1.1.0'),

    /*
    |--------------------------------------------------------------------------
    | Diretórios de módulos
    |--------------------------------------------------------------------------
    |
    | Cada raiz é varrida em busca do manifesto em dois níveis de diretório
    | (vendor/nome). Várias raízes podem ser separadas por vírgula.
    |
    */
    'paths' => array_values(array_filter(array_map(
        static fn (string $path): string => trim($path),
        explode(',', $paths),
    ))),

    /*
    |--------------------------------------------------------------------------
    | Estado de habilitação
    |--------------------------------------------------------------------------
    |
    | Arquivo JSON com os módulos desabilitados. Lido no boot sem consultar o
    | banco e mantido pelo comando core:modules:enable/disable.
    |
    */
    'state_path' => (string) env('STARTERKIT_MODULE_STATE', storage_path('app/modules.json')),

    /*
    |--------------------------------------------------------------------------
    | Schema do manifesto
    |--------------------------------------------------------------------------
    |
    | Schema vigente versionado pelo núcleo, distribuído em modules/.
    |
    */
    'schema_path' => base_path('modules/module.schema.json'),
];
