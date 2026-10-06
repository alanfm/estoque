<?php

namespace App\Core\Modules\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class EnableModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('modules.enable') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
