<?php

use Illuminate\Support\Facades\Route;
use Starterkit\ContractSample\Http\Controllers\PingController;

Route::get('/ping', PingController::class)
    ->middleware(['auth:sanctum', 'can:contract-sample.viewAny'])
    ->name('ping');
