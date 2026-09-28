<?php

namespace App\Core\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

final class ApiErrorResponse
{
    public static function from(Throwable $exception, Request $request): JsonResponse
    {
        $status = match (true) {
            $exception instanceof ValidationException => 422,
            $exception instanceof AuthenticationException => 401,
            $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
            default => 500,
        };

        [$code, $message] = match ($status) {
            400 => ['BAD_REQUEST', 'Requisição inválida.'],
            401 => ['UNAUTHENTICATED', 'Autenticação necessária.'],
            403 => ['FORBIDDEN', 'Acesso negado.'],
            404 => ['NOT_FOUND', 'Recurso não encontrado.'],
            405 => ['METHOD_NOT_ALLOWED', 'Método não permitido.'],
            409 => ['CONFLICT', 'Conflito com o estado atual.'],
            419 => ['SESSION_EXPIRED', 'Sessão expirada.'],
            422 => ['VALIDATION_FAILED', 'Os dados informados são inválidos.'],
            429 => ['RATE_LIMITED', 'Muitas tentativas.'],
            503 => ['SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.'],
            default => ['INTERNAL_ERROR', 'Não foi possível concluir a solicitação.'],
        };

        $details = $exception instanceof ValidationException
            ? ['fields' => $exception->errors()]
            : null;

        $headers = $exception instanceof HttpExceptionInterface ? $exception->getHeaders() : [];
        $requestId = $request->attributes->get('requestId');
        $headers['X-Request-Id'] = $requestId;

        return response()->json(['error' => compact('code', 'message', 'details') + ['requestId' => $requestId]], $status, $headers);
    }
}
