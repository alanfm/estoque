<?php

namespace App\Core\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'provider' => ['sometimes', 'string', 'in:auto,local,ldap'],
            'email' => ['prohibited'],
            'registry' => ['required', 'string', 'max:64', 'regex:/^[a-zA-Z0-9._-]+$/'],
            'password' => ['required', 'string', 'max:1024'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['provider' => $this->input('provider', 'auto')]);
        if (is_string($this->input('registry'))) {
            $this->merge(['registry' => mb_strtolower(trim($this->input('registry')))]);
        }
    }
}
