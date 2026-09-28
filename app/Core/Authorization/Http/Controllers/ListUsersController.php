<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Http\Requests\ListUsersRequest;
use App\Core\Authorization\Http\Resources\UserCollection;
use App\Core\Authorization\Queries\ListUsersQuery;

final class ListUsersController
{
    public function __invoke(ListUsersRequest $request, ListUsersQuery $query): UserCollection
    {
        return new UserCollection($query->execute(
            search: $request->validated('filter.search'),
            sort: (string) ($request->validated('sort') ?? 'name'),
            perPage: (int) ($request->validated('perPage') ?? 20),
        ));
    }
}
