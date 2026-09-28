<?php

namespace App\Core\Authorization\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getKey(),
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'roles' => $this->whenLoaded('roles', fn (): array => $this->resource->roles
                ->pluck('slug')
                ->map(static fn ($slug): string => (string) $slug)
                ->sort()
                ->values()
                ->all()),
            'createdAt' => $this->resource->created_at?->toIso8601String(),
        ];
    }
}
