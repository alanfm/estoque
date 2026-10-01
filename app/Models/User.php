<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

final class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = ['name', 'email'];

    protected $hidden = ['password'];

    /** @return BelongsToMany<Role, $this> */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->roles->contains('slug', Role::SUPER_ADMIN);
    }

    public function hasPermission(string $name): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return Permission::query()
            ->where('name', $name)
            ->whereNull('obsolete_at')
            ->whereHas('roles.users', fn (Builder $query) => $query->whereKey($this->getKey()))
            ->exists();
    }

    /** @return array<int, string> */
    public function permissionNames(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::query()
                ->whereNull('obsolete_at')
                ->orderBy('name')
                ->pluck('name')
                ->map(static fn ($name): string => (string) $name)
                ->all();
        }

        return Permission::query()
            ->whereNull('obsolete_at')
            ->whereHas('roles.users', fn (Builder $query) => $query->whereKey($this->getKey()))
            ->orderBy('name')
            ->pluck('name')
            ->map(static fn ($name): string => (string) $name)
            ->all();
    }
}
