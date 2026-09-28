<?php

namespace App\Core\Authorization\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');

        if ($actor === null || ! $target instanceof User || ! $actor->can('update', $target)) {
            return false;
        }

        return ! $this->requestsSuperAdmin() || $actor->isSuperAdmin();
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge(['email' => mb_strtolower((string) $this->input('email'))]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $target = $this->route('user');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($target instanceof User ? $target->getKey() : null),
            ],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'slug')],
        ];
    }

    private function requestsSuperAdmin(): bool
    {
        return $this->has('roles')
            && in_array(Role::SUPER_ADMIN, (array) $this->input('roles', []), true);
    }
}
