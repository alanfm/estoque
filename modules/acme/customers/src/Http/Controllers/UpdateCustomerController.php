<?php

namespace Acme\Customers\Http\Controllers;

use Acme\Customers\Application\Actions\SaveCustomerAction;
use Acme\Customers\Http\Requests\UpdateCustomerRequest;
use Acme\Customers\Http\Resources\CustomerResource;
use Acme\Customers\Models\Customer;

final class UpdateCustomerController
{
    public function __invoke(UpdateCustomerRequest $request, Customer $customer, SaveCustomerAction $action): CustomerResource
    {
        return new CustomerResource($action->update($customer, $request->validated()));
    }
}
