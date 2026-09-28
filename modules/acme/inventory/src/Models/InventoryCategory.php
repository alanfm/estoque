<?php

namespace Acme\Inventory\Models;

use Acme\Inventory\Database\Factories\InventoryCategoryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class InventoryCategory extends Model
{
    /** @use HasFactory<InventoryCategoryFactory> */
    use HasFactory;

    protected $table = 'inventory_categories';

    protected $fillable = ['name', 'normalized_name', 'active', 'version'];

    protected static function newFactory(): InventoryCategoryFactory
    {
        return InventoryCategoryFactory::new();
    }

    protected function casts(): array
    {
        return ['active' => 'boolean', 'version' => 'integer'];
    }
}
