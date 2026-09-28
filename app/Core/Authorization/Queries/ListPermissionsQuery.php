<?php

namespace App\Core\Authorization\Queries;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

final class ListPermissionsQuery
{
    /** @return Collection<int, Permission> */
    public function execute(?string $module, ?string $search): Collection
    {
        return Permission::query()
            ->when($module !== null && $module !== '', fn (Builder $query) => $query->where('module', $module))
            ->when($search !== null && $search !== '', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'))
            ->orderBy('module')
            ->orderBy('name')
            ->get();
    }
}
