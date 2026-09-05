import mongoose from 'mongoose';
import { encrypt, decrypt, maskAadhaar } from '../utils/encryption.js';
import { validateAadhaarChecksum, validatePAN, validateIndianMobile } from '../utils/validators.js';

const FileSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const DeliveryStatusSchema = new mongoose.Schema({
  ok: { type: Boolean, default: false },
  at: Date,
  error: String,
  attempts: { type: Number, default: 0 },
}, { _id: false });

const gstRegistrationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true, index: true, required: true },

    applicantName: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    mobile:        { type: String, required: true, index: true },
    altMobile:     String,
    email:         { type: String, required: true, lowercase: true, index: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },

    firmName:      { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    businessType:  {
      type: String,
      required: true,
      enum: ['Proprietorship','Partnership','LLP','Private Limited','Public Limited','HUF','Trust/Society','Other'],
    },
    businessNature: String,
    firmAddress:   { type: String, required: true, minlength: 10, maxlength: 300 },
    city:          { type: String, required: true, trim: true },
    state:         { type: String, required: true },
    pincode:       { type: String, required: true, match: /^\d{6}$/ },
    premisesType:  { type: String, enum: ['Owned', 'Rented'], required: true },

    panNumber:     { type: String, required: true, uppercase: true },
    aadhaarNumber: { type: String, required: true, select: false },
    aadhaarLast4:  String,

    documents: {
      aadhaarCard:          { type: FileSchema, required: true },
      panCard:              { type: FileSchema, required: true },
      photo:                { type: FileSchema, required: true },
      electricityBill:      { type: FileSchema, required: true },
      rentalAgreement:      FileSchema,
      propertyTaxReceipt:   FileSchema,
      ownerAadhaarFile:     FileSchema,
      witnessAadhaarFile:   FileSchema,
      bankProof:            FileSchema,
    },

    ownerName: String,
    ownerMobile: String,
    witnessName: String,
    witnessMobile: String,
    remarks: { type: String, maxlength: 500 },

    status: {
      type: String,
      enum: ['Submitted','Under Review','Documents Pending','Filed','ARN Generated','Approved','Rejected'],
      default: 'Submitted',
      index: true,
    },
    arn: String,
    gstin: String,
    internalNotes: String,

    consentAt: { type: Date, required: true },

    delivery: {
      sheetSynced:   { type: DeliveryStatusSchema, default: () => ({}) },
      emailSent:     { type: DeliveryStatusSchema, default: () => ({}) },
      whatsappSent:  { type: DeliveryStatusSchema, default: () => ({}) },
      pdfUrl: String,
    },

    meta: {
      ip: String,
      userAgent: String,
      source: { type: String, default: 'website' },
    },
  },
  { timestamps: true }
);

gstRegistrationSchema.path('panNumber').validate(function (v) {
  return validatePAN(v);
}, 'Invalid PAN format');

gstRegistrationSchema.path('aadhaarNumber').validate(function (v) {
  const plain = v && v.includes('.') ? decrypt(v) : v;
  return validateAadhaarChecksum(plain);
}, 'Invalid Aadhaar checksum');

gstRegistrationSchema.path('mobile').validate(function (v) {
  return validateIndianMobile(v);
}, 'Invalid Indian mobile number');

gstRegistrationSchema.pre('validate', function (next) {
  if (this.mobile) {
    const d = String(this.mobile).replace(/\D/g, '');
    this.mobile = d.length === 10 ? d : this.mobile;
  }
  if (this.altMobile) {
    const d = String(this.altMobile).replace(/\D/g, '');
    this.altMobile = d.length === 10 ? d : this.altMobile;
  }
  next();
});

gstRegistrationSchema.pre('save', function (next) {
  if (this.aadhaarNumber && !this.aadhaarNumber.includes('.')) {
    const plain = this.aadhaarNumber;
    this.aadhaarNumber = encrypt(plain);
    const d = String(plain).replace(/\D/g, '');
    this.aadhaarLast4 = d.length >= 4 ? d.slice(-4) : '';
  }
  if (this.panNumber) this.panNumber = this.panNumber.toUpperCase();
  next();
});

gstRegistrationSchema.methods.decryptAadhaar = function () {
  return decrypt(this.aadhaarNumber);
};

gstRegistrationSchema.methods.getMaskedAadhaar = function () {
  return maskAadhaar(this.aadhaarLast4 ? `XXXXXXXX${this.aadhaarLast4}` : '');
};

export const GstRegistration = mongoose.model('GstRegistration', gstRegistrationSchema);
export default GstRegistration;
