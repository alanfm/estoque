<?php

namespace App\Core\Authorization\Http\Resources;

use App\Core\Http\Resources\PaginatedResourceCollection;

final class RoleCollection extends PaginatedResourceCollection
{
    /** @var class-string<RoleResource> */
    public $collects = RoleResource::class;
}
