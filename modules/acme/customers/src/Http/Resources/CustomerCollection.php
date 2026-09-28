<?php

namespace Acme\Customers\Http\Resources;

use App\Core\Http\Resources\PaginatedResourceCollection;

final class CustomerCollection extends PaginatedResourceCollection
{
    /** @var class-string<CustomerResource> */
    public $collects = CustomerResource::class;
}
