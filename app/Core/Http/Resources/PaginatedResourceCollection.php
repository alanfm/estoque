<?php

namespace App\Core\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class PaginatedResourceCollection extends ResourceCollection
{
    /** @return array<string, array<string, mixed>> */
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => [
                'currentPage' => $paginated['current_page'],
                'from' => $paginated['from'],
                'lastPage' => $paginated['last_page'],
                'perPage' => $paginated['per_page'],
                'to' => $paginated['to'],
                'total' => $paginated['total'],
            ],
        ];
    }
}
