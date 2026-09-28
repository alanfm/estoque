<?php

namespace App\Core\Authorization\Http\Requests;

use App\Models\Permission;
use Illuminate\Foundation\Http\FormRequest;

final class ListPermissionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->can('viewAny', Permission::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'filter' => ['sometimes', 'array'],
            'filter.module' => ['sometimes', 'nullable', 'string', 'max:255'],
            'filter.search' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
