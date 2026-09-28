<?php

namespace Acme\Customers\Application\Queries;

use Acme\Customers\Models\Customer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class ListCustomersQuery
{
    public function execute(?string $search, int $perPage): LengthAwarePaginator
    {
        return Customer::query()
            ->when($search !== null && $search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();
    }
}
