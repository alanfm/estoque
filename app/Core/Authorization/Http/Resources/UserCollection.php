<?php

namespace App\Core\Authorization\Http\Resources;

use App\Core\Http\Resources\PaginatedResourceCollection;

final class UserCollection extends PaginatedResourceCollection
{
    /** @var class-string<UserResource> */
    public $collects = UserResource::class;
}
