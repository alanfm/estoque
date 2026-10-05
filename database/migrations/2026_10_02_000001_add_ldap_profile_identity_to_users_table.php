<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('ldap_managed')->default(false);
            $table->string('ldap_object_id', 32)->nullable()->unique();
            $table->timestamp('ldap_synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['ldap_object_id']);
            $table->dropColumn(['ldap_managed', 'ldap_object_id', 'ldap_synced_at']);
        });
    }
};
