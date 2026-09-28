<?php

namespace Acme\Customers\Application\Actions;

use Acme\Customers\Models\Customer;

final class SaveCustomerAction
{
    /** @param array{name: string, email: string, phone?: string|null, company?: string|null} $data */
    public function create(array $data): Customer
    {
        return Customer::query()->create($data);
    }

    /** @param array{name: string, email: string, phone?: string|null, company?: string|null} $data */
    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);

        return $customer->refresh();
    }
}
