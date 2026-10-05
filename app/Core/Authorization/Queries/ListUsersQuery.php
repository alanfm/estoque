<?php

namespace App\Core\Authorization\Queries;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

final class ListUsersQuery
{
    /** @return LengthAwarePaginator<int, User> */
    public function execute(?string $search, string $sort, int $perPage): LengthAwarePaginator
    {
        [$column, $direction] = $this->parseSort($sort);

        return User::query()
            ->with('roles')
            ->when($search !== null && $search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query->where('name', 'like', '%'.$search.'%')
                        ->orWhere('registry', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->orderBy($column, $direction)
            ->paginate(perPage: $perPage);
    }

    /** @return array{0: string, 1: string} */
    private function parseSort(string $sort): array
    {
        $columns = ['name' => 'name', 'registry' => 'registry', 'email' => 'email', 'createdAt' => 'created_at'];

        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $key = ltrim($sort, '-');

        return [$columns[$key] ?? 'name', $direction];
    }
}
