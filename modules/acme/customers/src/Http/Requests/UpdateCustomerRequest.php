<?php

namespace Acme\Customers\Http\Requests;

final class UpdateCustomerRequest extends CustomerRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('customer')) ?? false;
    }

    public function rules(): array
    {
        return array_map(static fn (array $rules): array => array_merge(['sometimes'], $rules), $this->customerRules());
    }
}
