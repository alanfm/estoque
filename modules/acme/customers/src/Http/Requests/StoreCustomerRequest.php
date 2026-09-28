<?php

namespace Acme\Customers\Http\Requests;

use Acme\Customers\Models\Customer;

final class StoreCustomerRequest extends CustomerRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Customer::class) ?? false;
    }

    public function rules(): array
    {
        return $this->customerRules();
    }
}
