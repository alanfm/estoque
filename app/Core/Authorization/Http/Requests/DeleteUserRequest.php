<?php

namespace App\Core\Authorization\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

final class DeleteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $actor = $this->user();
        $target = $this->route('user');

        return $actor !== null && $target instanceof User && $actor->can('delete', $target);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [];
    }
}
