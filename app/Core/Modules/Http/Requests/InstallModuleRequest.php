<?php

namespace App\Core\Modules\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class InstallModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('modules.install') === true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['repository' => ['required', 'string', 'max:500']];
    }
}
