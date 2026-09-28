<?php

namespace Acme\Customers\Http\Requests;

use Acme\Customers\Models\Customer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class CustomerRequest extends FormRequest
{
    protected function customerRules(): array
    {
        $customer = $this->route('customer');

        return [
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:254', Rule::unique('customers', 'email')->ignore($customer instanceof Customer ? $customer->id : null)],
            'phone' => ['nullable', 'string', 'max:32'],
            'company' => ['nullable', 'string', 'max:160'],
        ];
    }
}
