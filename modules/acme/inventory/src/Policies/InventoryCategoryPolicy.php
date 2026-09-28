<?php

namespace Acme\Inventory\Policies;

use Acme\Inventory\Models\InventoryCategory;
use App\Models\User;

final class InventoryCategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('inventory.categories.viewAny');
    }

    public function view(User $user, InventoryCategory $category): bool
    {
        return $user->hasPermission('inventory.categories.viewAny');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('inventory.categories.create');
    }

    public function update(User $user, InventoryCategory $category): bool
    {
        return $user->hasPermission('inventory.categories.update');
    }
}
