<?php

namespace Acme\Inventory\Policies;

use Acme\Inventory\Models\InventoryItem;
use App\Models\User;

final class InventoryItemPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('inventory.items.viewAny');
    }

    public function view(User $user, InventoryItem $item): bool
    {
        return $user->hasPermission('inventory.items.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('inventory.items.create');
    }

    public function update(User $user, InventoryItem $item): bool
    {
        return $user->hasPermission('inventory.items.update');
    }
}
