<?php

namespace App\Core\Authorization\Http\Requests;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();

        if ($actor === null || ! $actor->can('create', User::class)) {
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
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::exists('roles', 'slug')],
        ];
    }

    private function requestsSuperAdmin(): bool
    {
        return in_array(Role::SUPER_ADMIN, (array) $this->input('roles', []), true);
    }
}
