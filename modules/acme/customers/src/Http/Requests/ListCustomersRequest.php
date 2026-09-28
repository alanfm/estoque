<?php

namespace Acme\Customers\Http\Requests;

use Acme\Customers\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;

final class ListCustomersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Customer::class) ?? false;
    }

    public function rules(): array
    {
        return ['search' => ['nullable', 'string', 'max:120'], 'per_page' => ['nullable', 'integer', 'min:1', 'max:100']];
    }
}
