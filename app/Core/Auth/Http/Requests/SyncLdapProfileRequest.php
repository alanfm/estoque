<?php

namespace App\Core\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SyncLdapProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->ldap_managed && $this->user()->ldap_enabled;
    }

    public function rules(): array
    {
        return ['password' => ['required', 'string', 'max:1024']];
    }
}
