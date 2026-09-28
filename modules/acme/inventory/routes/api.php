<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'can:inventory.dashboard.view'])
    ->get('/health', static fn () => response()->json(['data' => ['module' => 'inventory']]));
