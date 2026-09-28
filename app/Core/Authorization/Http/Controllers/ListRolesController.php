<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Http\Requests\ListRolesRequest;
use App\Core\Authorization\Http\Resources\RoleCollection;
use App\Core\Authorization\Queries\ListRolesQuery;

final class ListRolesController
{
    public function __invoke(ListRolesRequest $request, ListRolesQuery $query): RoleCollection
    {
        return new RoleCollection($query->execute(
            search: $request->validated('filter.search'),
            sort: (string) ($request->validated('sort') ?? 'name'),
            perPage: (int) ($request->validated('perPage') ?? 20),
        ));
    }
}
