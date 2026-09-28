<?php

namespace Acme\Customers\Http\Controllers;

use Acme\Customers\Http\Resources\CustomerResource;
use Acme\Customers\Models\Customer;
use Illuminate\Http\Request;

final class ShowCustomerController
{
    public function __invoke(Request $request, Customer $customer): CustomerResource
    {
        abort_unless($request->user()?->can('view', $customer), 403);

        return new CustomerResource($customer);
    }
}
