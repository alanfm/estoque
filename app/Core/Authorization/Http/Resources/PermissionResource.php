<?php

namespace App\Core\Authorization\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class PermissionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->resource->name,
            'module' => $this->resource->module,
            'description' => $this->resource->description,
            'obsolete' => $this->resource->isObsolete(),
        ];
    }
}
