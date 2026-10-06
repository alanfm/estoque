<?php

namespace App\Core\Modules\Http\Resources;

use App\Core\Modules\ModuleDescriptor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ModuleDescriptor */
final class ModuleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->manifest->name,
            'displayName' => $this->manifest->displayName,
            'version' => $this->manifest->version,
            'core' => $this->manifest->core,
            'enabled' => $this->enabled,
            'issues' => $this->issues,
            'dependencies' => $this->manifest->dependencies,
        ];
    }
}
