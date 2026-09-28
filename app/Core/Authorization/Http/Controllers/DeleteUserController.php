<?php

namespace App\Core\Authorization\Http\Controllers;

use App\Core\Authorization\Actions\DeleteUserAction;
use App\Core\Authorization\Http\Requests\DeleteUserRequest;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

final class DeleteUserController
{
    public function __invoke(DeleteUserRequest $request, User $user, DeleteUserAction $action): Response
    {
        $action->execute($user);

        return response()->noContent();
    }
}
