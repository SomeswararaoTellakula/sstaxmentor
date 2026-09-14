<?php

namespace Tests\Feature;

use App\Models\GstRegistration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GstApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_available(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJson(['ok' => true]);
    }

    public function test_unknown_application_cannot_be_tracked(): void
    {
        $this->getJson('/api/gst/track/GST-2099-999999')
            ->assertNotFound()
            ->assertJson(['error' => 'Application not found']);
    }

    public function test_registration_model_masks_aadhaar(): void
    {
        $registration = GstRegistration::create([
            'application_id' => 'GST-2026-000001', 'applicant_name' => 'Test Applicant', 'mobile' => '9876543210',
            'email' => 'test@example.com', 'firm_name' => 'Test Firm', 'business_type' => 'Proprietorship',
            'firm_address' => '123 Test Street, Test Area', 'city' => 'Delhi', 'state' => 'Delhi', 'pincode' => '110001',
            'premises_type' => 'Owned', 'pan_number' => 'ABCDE1234F', 'aadhaar_number' => '234567890123',
            'documents' => [], 'consent_at' => now(),
        ]);

        $this->assertSame('XXXX XXXX 0123', $registration->maskedAadhaar());
        $this->assertSame('234567890123', $registration->getDecryptedAadhaar());
    }
}
