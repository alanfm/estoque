<?php

namespace Acme\Customers\Http\Controllers;

use Acme\Customers\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class DeleteCustomerController
{
    public function __invoke(Request $request, Customer $customer): Response
    {
        abort_unless($request->user()?->can('delete', $customer), 403);
        $customer->delete();

        return response()->noContent();
    }
}
