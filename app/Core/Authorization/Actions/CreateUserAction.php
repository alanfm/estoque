<?php

namespace App\Core\Authorization\Actions;

use App\Core\Auth\Actions\SendPasswordResetLinkAction;
use App\Core\Authorization\DTOs\CreateUserData;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class CreateUserAction
{
    public function __construct(private readonly SendPasswordResetLinkAction $sendPasswordResetLink) {}

    public function execute(CreateUserData $data): User
    {
        $user = DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                'name' => $data->name,
                'email' => mb_strtolower($data->email),
                'registry' => $data->registry,
                'ldap_enabled' => $data->ldapEnabled,
                'local_auth_enabled' => $data->localAuthEnabled,
            ]);
            $user->password = null;
            $user->save();
            $user->roles()->sync($this->roleIds($data->roles));

            return $user;
        });

        if ($user->local_auth_enabled) {
            $this->sendPasswordResetLink->execute($user->email);
        }

        return $user->load('roles');
    }

    /**
     * @param  array<int, string>  $slugs
     * @return array<int, int>
     */
    private function roleIds(array $slugs): array
    {
        return Role::query()
            ->whereIn('slug', $slugs)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();
    }
}
