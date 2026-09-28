<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('installation_probes', function (Blueprint $table): void {
            $table->id();
            $table->string('label')->unique();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('installation_probes');
    }
};
