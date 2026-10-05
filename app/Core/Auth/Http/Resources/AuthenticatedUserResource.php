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
            'registry' => $this->resource->registry,
            'accountSource' => $this->resource->ldap_managed ? 'ldap' : 'local',
            'ldapSyncedAt' => $this->resource->ldap_synced_at?->toISOString(),
            'roles' => $this->resource->roles->pluck('slug')->all(),
            'isSuperAdmin' => $this->resource->isSuperAdmin(),
            'permissions' => $this->resource->permissionNames(),
            'authentication' => [
                'provider' => $request->session()->get('auth_provider', 'local'),
                'canChangeLocalPassword' => ! $this->resource->ldap_managed && (bool) $this->resource->local_auth_enabled,
            ],
        ];
    }
}
