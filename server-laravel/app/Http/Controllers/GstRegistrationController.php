<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterGstRequest;
use App\Models\GstRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class GstRegistrationController extends Controller
{
    private const DOCUMENT_FIELDS = [
        'aadhaarCard', 'panCard', 'photo', 'electricityBill', 'rentalAgreement',
        'propertyTaxReceipt', 'ownerAadhaarFile', 'witnessAadhaarFile', 'bankProof',
    ];

    public function store(RegisterGstRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $applicationId = $this->nextApplicationId();
        $documents = [];

        foreach (self::DOCUMENT_FIELDS as $field) {
            if (!$request->hasFile($field)) {
                continue;
            }

            $file = $request->file($field);
            $path = $file->store("gst/{$applicationId}", 'public');
            $documents[$field] = [
                'url' => Storage::disk('public')->url($path),
                'path' => $path,
                'originalName' => $file->getClientOriginalName(),
                'mimeType' => $file->getMimeType(),
                'sizeBytes' => $file->getSize(),
                'uploadedAt' => now()->toISOString(),
            ];
        }

        $registration = GstRegistration::create([
            'application_id' => $applicationId,
            'applicant_name' => trim($validated['applicantName']),
            'mobile' => $validated['mobile'],
            'alt_mobile' => $validated['altMobile'] ?? null,
            'email' => strtolower($validated['email']),
            'firm_name' => trim($validated['firmName']),
            'business_type' => $validated['businessType'],
            'business_nature' => $validated['businessNature'] ?? null,
            'firm_address' => trim($validated['firmAddress']),
            'city' => trim($validated['city']),
            'state' => $validated['state'],
            'pincode' => $validated['pincode'],
            'premises_type' => $validated['premisesType'],
            'pan_number' => strtoupper($validated['panNumber']),
            'aadhaar_number' => $validated['aadhaarNumber'],
            'documents' => $documents,
            'owner_name' => $validated['ownerName'] ?? null,
            'owner_mobile' => $validated['ownerMobile'] ?? null,
            'witness_name' => $validated['witnessName'] ?? null,
            'witness_mobile' => $validated['witnessMobile'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
            'consent_at' => now(),
            'delivery' => [
                'sheetSynced' => ['ok' => false, 'attempts' => 0, 'error' => 'Not configured'],
                'emailSent' => ['ok' => false, 'attempts' => 0, 'error' => 'Not configured'],
                'whatsappSent' => ['ok' => false, 'attempts' => 0, 'error' => 'Not configured'],
            ],
            'meta' => [
                'ip' => $request->ip(),
                'userAgent' => $request->userAgent(),
                'source' => $validated['source'] ?? 'website',
            ],
        ]);

        return response()->json([
            'applicationId' => $registration->application_id,
            'pdfUrl' => url("/api/gst/{$registration->application_id}/pdf"),
            'delivery' => $registration->delivery,
        ], 201);
    }

    public function track(string $applicationId): JsonResponse
    {
        $registration = GstRegistration::where('application_id', $applicationId)->first();
        if (!$registration) {
            return response()->json(['error' => 'Application not found'], 404);
        }

        return response()->json([
            'applicationId' => $registration->application_id,
            'status' => $registration->status,
            'arn' => $registration->arn,
            'gstin' => $registration->gstin,
            'submittedAt' => $registration->created_at,
            'updatedAt' => $registration->updated_at,
            'applicantName' => $registration->applicant_name,
            'firmName' => $registration->firm_name,
        ]);
    }

    public function pdf(string $applicationId)
    {
        $registration = GstRegistration::where('application_id', $applicationId)->first();
        if (!$registration) {
            return response()->json(['error' => 'PDF not found'], 404);
        }

        $pdf = Pdf::loadView('pdf.acknowledgement', ['registration' => $registration]);
        return $pdf->download("{$applicationId}-acknowledgement.pdf");
    }

    private function nextApplicationId(): string
    {
        $prefix = 'GST-'.now()->format('Y').'-';
        $last = GstRegistration::where('application_id', 'like', $prefix.'%')
            ->latest('id')->value('application_id');
        $sequence = $last ? ((int) Str::afterLast($last, '-')) + 1 : 1;
        return $prefix.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }
}
