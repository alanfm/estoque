<?php

namespace Acme\Customers\Http\Controllers;

use Acme\Customers\Application\Queries\ListCustomersQuery;
use Acme\Customers\Http\Requests\ListCustomersRequest;
use Acme\Customers\Http\Resources\CustomerCollection;

final class ListCustomersController
{
    public function __invoke(ListCustomersRequest $request, ListCustomersQuery $query): CustomerCollection
    {
        return new CustomerCollection($query->execute(
            $request->validated('search'),
            (int) $request->validated('per_page', 20),
        ));
    }
}
