<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class GstRegistration extends Model
{
    protected $fillable = [
        'application_id', 'applicant_name', 'mobile', 'alt_mobile', 'email', 'firm_name',
        'business_type', 'business_nature', 'firm_address', 'city', 'state', 'pincode',
        'premises_type', 'pan_number', 'aadhaar_number', 'aadhaar_last4', 'documents',
        'owner_name', 'owner_mobile', 'witness_name', 'witness_mobile', 'remarks', 'status',
        'arn', 'gstin', 'internal_notes', 'consent_at', 'delivery', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'documents' => 'array',
            'delivery' => 'array',
            'meta' => 'array',
            'consent_at' => 'datetime',
        ];
    }

    public function setAadhaarNumberAttribute($value): void
    {
        $this->attributes['aadhaar_number'] = Crypt::encryptString((string) $value);
        $digits = preg_replace('/\D/', '', (string) $value);
        $this->attributes['aadhaar_last4'] = substr($digits, -4);
    }

    public function getDecryptedAadhaar(): ?string
    {
        try {
            return Crypt::decryptString($this->aadhaar_number);
        } catch (\Throwable) {
            return null;
        }
    }

    public function maskedAadhaar(): string
    {
        return $this->aadhaar_last4 ? 'XXXX XXXX '.$this->aadhaar_last4 : '';
    }
}
