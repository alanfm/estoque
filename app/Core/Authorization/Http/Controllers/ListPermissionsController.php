<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Http\Requests\ListPermissionsRequest;
use App\Core\Authorization\Http\Resources\PermissionResource;
use App\Core\Authorization\Queries\ListPermissionsQuery;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class ListPermissionsController
{
    public function __invoke(ListPermissionsRequest $request, ListPermissionsQuery $query): AnonymousResourceCollection
    {
        return PermissionResource::collection($query->execute(
            module: $request->validated('filter.module'),
            search: $request->validated('filter.search'),
        ));
    }
}
