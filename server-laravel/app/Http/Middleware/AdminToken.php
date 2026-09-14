<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AdminToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->cookie('admin_token')
            ?: preg_replace('/^Bearer\s+/i', '', (string) $request->header('Authorization'));
        $accessToken = $token ? PersonalAccessToken::findToken($token) : null;

        if (!$accessToken || !$accessToken->tokenable) {
            return response()->json(['error' => 'Invalid or expired session'], 401);
        }

        $request->setUserResolver(fn () => $accessToken->tokenable);
        return $next($request);
    }
}
