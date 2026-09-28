<?php

namespace App\Core\Auth\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string'],
            'password' => ['required', 'string', Password::min(12)],
            'passwordConfirmation' => ['required', 'same:password'],
        ];
    }
}
