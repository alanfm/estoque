<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class Permission extends Model
{
    protected $fillable = ['name', 'module', 'description', 'obsolete_at'];

    protected function casts(): array
    {
        return ['obsolete_at' => 'immutable_datetime'];
    }

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function isObsolete(): bool
    {
        return $this->obsolete_at !== null;
    }
}
