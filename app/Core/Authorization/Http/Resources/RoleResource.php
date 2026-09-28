<?php

namespace App\Core\Authorization\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class RoleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getKey(),
            'slug' => $this->resource->slug,
            'name' => $this->resource->name,
            'isSystem' => $this->resource->isSuperAdmin(),
            'permissions' => $this->whenLoaded('permissions', fn (): array => $this->resource->permissions
                ->pluck('name')
                ->map(static fn ($name): string => (string) $name)
                ->sort()
                ->values()
                ->all()),
            'usersCount' => $this->when(
                isset($this->resource->users_count),
                fn (): int => (int) $this->resource->users_count,
            ),
            'createdAt' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
