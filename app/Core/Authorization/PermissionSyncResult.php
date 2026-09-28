<?php

namespace App\Core\Authorization;

final readonly class PermissionSyncResult
{
    public function __construct(
        public int $created,
        public int $updated,
        public int $restored,
        public int $obsoleted,
    ) {}

    /** @return array{created: int, updated: int, restored: int, obsoleted: int} */
    public function toArray(): array
    {
        return [
            'created' => $this->created,
            'updated' => $this->updated,
            'restored' => $this->restored,
            'obsoleted' => $this->obsoleted,
        ];
    }
}
