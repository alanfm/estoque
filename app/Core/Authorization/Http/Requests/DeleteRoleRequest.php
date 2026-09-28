<?php

namespace App\Core\Authorization\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('role');

        return $actor !== null && $target instanceof Role && $actor->can('delete', $target);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
