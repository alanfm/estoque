<?php

namespace App\Core\Authorization\Http\Requests;

use App\Core\Auth\Ldap\Registry;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
        if (is_string($this->input('registry'))) {
            $this->merge(['registry' => Registry::normalize($this->input('registry'))]);
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
            'registry' => ['required', 'string', 'max:64', 'regex:/^[a-z0-9._-]+$/', Rule::unique('users', 'registry')],
            'ldapEnabled' => ['sometimes', 'boolean'],
            'localAuthEnabled' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $ldap = $this->boolean('ldapEnabled', false);
            $local = $this->boolean('localAuthEnabled', true);
            if (! $ldap && ! $local) {
                $validator->errors()->add('localAuthEnabled', 'A conta precisa manter uma origem de autenticação habilitada.');
            }
        });
    }

    private function requestsSuperAdmin(): bool
    {
        return in_array(Role::SUPER_ADMIN, (array) $this->input('roles', []), true);
    }
}
