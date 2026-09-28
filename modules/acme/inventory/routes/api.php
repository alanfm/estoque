<?php

use Acme\Inventory\Http\Controllers\CatalogController;
use Acme\Inventory\Http\Controllers\MovementController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::post('/categories', [CatalogController::class, 'createCategory']);
    Route::patch('/categories/{category}', [CatalogController::class, 'updateCategory']);
    Route::get('/items', [CatalogController::class, 'items']);
    Route::post('/items', [CatalogController::class, 'createItem']);
    Route::get('/items/{item}', [CatalogController::class, 'showItem']);
    Route::patch('/items/{item}', [CatalogController::class, 'updateItem']);
    Route::post('/items/{item}/variants', [CatalogController::class, 'createVariant']);
    Route::patch('/variants/{variant}', [CatalogController::class, 'updateVariant']);
    Route::get('/movements', [MovementController::class, 'index']);
    Route::post('/movements', [MovementController::class, 'create']);
    Route::get('/movements/{movement}', [MovementController::class, 'show']);
    Route::patch('/movements/{movement}', [MovementController::class, 'update']);
    Route::post('/movements/{movement}/cancel', [MovementController::class, 'cancel']);
});
