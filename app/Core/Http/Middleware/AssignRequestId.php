<?php

namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class AssignRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('requestId', (string) Str::ulid());

        $response = $next($request);
        $response->headers->set('X-Request-Id', $request->attributes->get('requestId'));

        return $response;
    }
}
