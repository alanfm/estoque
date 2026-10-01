<?php

namespace App\Core\Auth\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AuthenticatedUserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getKey(),
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'roles' => $this->resource->roles->pluck('slug')->all(),
            'isSuperAdmin' => $this->resource->isSuperAdmin(),
            'permissions' => $this->resource->permissionNames(),
        ];
    }
}
