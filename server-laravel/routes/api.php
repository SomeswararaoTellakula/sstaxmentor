<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\GstRegistrationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['ok' => true, 'env' => app()->environment()]));

Route::prefix('gst')->group(function () {
    Route::post('/register', [GstRegistrationController::class, 'store'])->middleware('throttle:5,60');
    Route::get('/track/{applicationId}', [GstRegistrationController::class, 'track'])->middleware('throttle:30,1');
    Route::get('/{applicationId}/pdf', [GstRegistrationController::class, 'pdf']);
});

Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminController::class, 'login'])->middleware('throttle:10,15');
    Route::post('/logout', [AdminController::class, 'logout'])->middleware('admin.token');
    Route::middleware('admin.token')->group(function () {
        Route::get('/me', [AdminController::class, 'me']);
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/registrations', [AdminController::class, 'index']);
        Route::get('/registrations/export', [AdminController::class, 'export']);
        Route::get('/registrations/{id}', [AdminController::class, 'show']);
        Route::patch('/registrations/{id}', [AdminController::class, 'update']);
        Route::post('/registrations/{id}/resend', [AdminController::class, 'resend']);
        Route::delete('/registrations/{id}', [AdminController::class, 'destroy']);
    });
});
