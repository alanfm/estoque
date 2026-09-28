<?php

namespace Acme\Customers\Http\Controllers;

use Acme\Customers\Application\Actions\SaveCustomerAction;
use Acme\Customers\Http\Requests\StoreCustomerRequest;
use Acme\Customers\Http\Resources\CustomerResource;

final class StoreCustomerController
{
    public function __invoke(StoreCustomerRequest $request, SaveCustomerAction $action): CustomerResource
    {
        return new CustomerResource($action->create($request->validated()));
    }
}
