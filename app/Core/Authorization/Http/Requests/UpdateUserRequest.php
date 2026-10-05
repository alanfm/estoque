<?php

namespace App\Core\Authorization\Http\Requests;

use App\Core\Auth\Ldap\Registry;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
        if (is_string($this->input('registry'))) {
            $this->merge(['registry' => Registry::normalize($this->input('registry'))]);
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
            'registry' => ['sometimes', 'required', 'string', 'max:64', 'regex:/^[a-z0-9._-]+$/', Rule::unique('users', 'registry')->ignore($target instanceof User ? $target->getKey() : null)],
            'ldapEnabled' => ['sometimes', 'boolean'],
            'localAuthEnabled' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $target = $this->route('user');
            if (! $target instanceof User) {
                return;
            }
            $ldap = $this->has('ldapEnabled') ? $this->boolean('ldapEnabled') : $target->ldap_enabled;
            $local = $this->has('localAuthEnabled') ? $this->boolean('localAuthEnabled') : $target->local_auth_enabled;
            $registry = $this->has('registry') ? $this->input('registry') : $target->registry;
            if ($ldap && blank($registry)) {
                $validator->errors()->add('registry', 'Informe a matrícula para habilitar o acesso institucional.');
            }
            if (! $ldap && ! $local) {
                $validator->errors()->add('localAuthEnabled', 'A conta precisa manter uma origem de autenticação habilitada.');
            }
        });
    }

    private function requestsSuperAdmin(): bool
    {
        return $this->has('roles')
            && in_array(Role::SUPER_ADMIN, (array) $this->input('roles', []), true);
    }
}
