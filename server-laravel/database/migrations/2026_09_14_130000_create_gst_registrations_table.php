<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gst_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('application_id')->unique();
            $table->string('applicant_name');
            $table->string('mobile', 20)->index();
            $table->string('alt_mobile', 20)->nullable();
            $table->string('email')->index();
            $table->string('firm_name');
            $table->string('business_type');
            $table->string('business_nature')->nullable();
            $table->text('firm_address');
            $table->string('city');
            $table->string('state');
            $table->string('pincode', 6);
            $table->string('premises_type');
            $table->string('pan_number', 10);
            $table->text('aadhaar_number');
            $table->string('aadhaar_last4', 4);
            $table->json('documents');
            $table->string('owner_name')->nullable();
            $table->string('owner_mobile', 20)->nullable();
            $table->string('witness_name')->nullable();
            $table->string('witness_mobile', 20)->nullable();
            $table->string('remarks', 500)->nullable();
            $table->string('status')->default('Submitted')->index();
            $table->string('arn')->nullable();
            $table->string('gstin')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamp('consent_at');
            $table->json('delivery')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gst_registrations');
    }
};
