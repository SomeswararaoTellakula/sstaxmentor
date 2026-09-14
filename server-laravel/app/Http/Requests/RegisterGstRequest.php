<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterGstRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'applicantName' => ['required', 'string', 'min:3', 'max:100', "regex:/^[A-Za-z .']+$/"],
            'mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'altMobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'email' => ['required', 'email'],
            'firmName' => ['required', 'string', 'min:3', 'max:150'],
            'businessType' => ['required', Rule::in(['Proprietorship','Partnership','LLP','Private Limited','Public Limited','HUF','Trust/Society','Other'])],
            'businessNature' => ['nullable', 'string', 'max:200'],
            'firmAddress' => ['required', 'string', 'min:10', 'max:300'],
            'city' => ['required', 'string', 'min:2', 'max:60'],
            'state' => ['required', 'string'],
            'pincode' => ['required', 'digits:6'],
            'premisesType' => ['required', Rule::in(['Owned', 'Rented'])],
            'panNumber' => ['required', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/i'],
            'aadhaarNumber' => ['required', 'digits:12'],
            'ownerName' => ['nullable', 'string', 'max:100'],
            'ownerMobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'witnessName' => ['nullable', 'string', 'max:100'],
            'witnessMobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'consent' => ['accepted'],
            'aadhaarCard' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'panCard' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'photo' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'electricityBill' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'rentalAgreement' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'propertyTaxReceipt' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'ownerAadhaarFile' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'witnessAadhaarFile' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'bankProof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'mobile' => preg_replace('/\D/', '', (string) $this->mobile),
            'altMobile' => $this->altMobile ? preg_replace('/\D/', '', (string) $this->altMobile) : null,
            'panNumber' => strtoupper((string) $this->panNumber),
        ]);
    }
}
