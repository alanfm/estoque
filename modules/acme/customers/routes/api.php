<?php

use Acme\Customers\Http\Controllers\DeleteCustomerController;
use Acme\Customers\Http\Controllers\ListCustomersController;
use Acme\Customers\Http\Controllers\ShowCustomerController;
use Acme\Customers\Http\Controllers\StoreCustomerController;
use Acme\Customers\Http\Controllers\UpdateCustomerController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/', ListCustomersController::class)->name('index');
    Route::post('/', StoreCustomerController::class)->name('store');
    Route::get('/{customer}', ShowCustomerController::class)->name('show');
    Route::patch('/{customer}', UpdateCustomerController::class)->name('update');
    Route::delete('/{customer}', DeleteCustomerController::class)->name('destroy');
});
