<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('registry', 64)->nullable()->unique();
            $table->boolean('ldap_enabled')->default(false);
            $table->boolean('local_auth_enabled')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['registry']);
            $table->dropColumn(['registry', 'ldap_enabled', 'local_auth_enabled']);
        });
    }
};
