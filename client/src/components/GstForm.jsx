import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Send, Shield, CheckCircle2, Loader2, Download, Mail, MessageCircle, Database } from 'lucide-react';
import FormFileUpload from '../components/FormFileUpload.jsx';
import { INDIAN_STATES, BUSINESS_TYPES } from '../lib/utils.js';
import { formatPan, formatAadhaarInput, formatMobileInput, formatPincode, validateAadhaar, validatePAN, validateMobile, validatePincode } from '../lib/formatters.js';
import api from '../lib/api.js';

const STORAGE_KEY = 'sstax-gst-form-draft-v1';

const stripNonDigits = (v) => (v === undefined || v === null) ? '' : String(v).replace(/\D/g, '');
const stripPan = (v) => (v === undefined || v === null) ? '' : String(v).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
const stripNonDigitPin = (v) => (v === undefined || v === null) ? '' : String(v).replace(/\D/g, '');
const trimStr = (v) => (v === undefined || v === null) ? '' : String(v).trim();

const applicantSchema = z.object({
  applicantName: z.preprocess(trimStr, z.string().min(3, 'Min 3 characters').max(100).regex(/^[A-Za-z .']+$/, 'Letters, spaces, dots, apostrophes only')),
  mobile: z.preprocess(stripNonDigits, z.string().refine((v) => validateMobile(v), 'Enter a valid 10-digit Indian mobile number')),
  altMobile: z.preprocess((v) => !v ? '' : stripNonDigits(v), z.string().optional().refine((v) => !v || validateMobile(v), 'Invalid mobile')),
  email: z.preprocess((v) => String(v || '').trim(), z.string().email('Enter a valid email')),
});

const businessSchema = z.object({
  firmName: z.preprocess(trimStr, z.string().min(3, 'Min 3 characters').max(150)),
  businessType: z.enum(BUSINESS_TYPES, { required_error: 'Select business type' }),
  businessNature: z.preprocess((v) => v === undefined || v === null ? '' : String(v).trim(), z.string().max(200).optional()),
  firmAddress: z.preprocess(trimStr, z.string().min(10, 'Min 10 characters').max(300)),
  city: z.preprocess(trimStr, z.string().min(2)),
  state: z.enum(INDIAN_STATES, { required_error: 'Select state' }),
  pincode: z.preprocess(stripNonDigitPin, z.string().refine((v) => validatePincode(v), 'Enter a valid 6-digit PIN')),
  premisesType: z.enum(['Owned', 'Rented'], { required_error: 'Select premises type' }),
});

const docsSchema = z.object({
  panNumber: z.preprocess(stripPan, z.string().refine((v) => validatePAN(v), 'Invalid PAN (eg. ABCDE1234F)')),
  aadhaarNumber: z.preprocess(stripNonDigits, z.string().refine((v) => validateAadhaar(v), 'Invalid Aadhaar number')),
});

const optionalSchema = z.object({
  ownerMobile: z.preprocess((v) => !v ? '' : stripNonDigits(v), z.string().optional().refine((v) => !v || validateMobile(v), 'Invalid owner mobile')),
  witnessMobile: z.preprocess((v) => !v ? '' : stripNonDigits(v), z.string().optional().refine((v) => !v || validateMobile(v), 'Invalid witness mobile')),
  remarks: z.preprocess((v) => v === undefined || v === null ? '' : String(v).trim(), z.string().max(500).optional()),
  consent: z.literal('true', { message: 'Please consent to use of documents.' }),
});

function useFileField({ setValue, fieldName, watch }) {
  const value = watch(fieldName);
  return {
    fieldName,
    file: value,
    onSelect: (f) => {
      setValue(fieldName, f, { shouldValidate: true, shouldDirty: true });
    },
    onRemove: () => setValue(fieldName, undefined, { shouldValidate: true }),
  };
}

const STEPS = ['Applicant', 'Business', 'Mandatory Docs', 'Optional & Submit'];

export default function GstForm({ onSuccess }) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mainSchema = z.intersection(
    z.intersection(applicantSchema, businessSchema),
    z.intersection(docsSchema, z.object({
      aadhaarCard: z.any().optional(),
      panCard: z.any().optional(),
      photo: z.any().optional(),
      electricityBill: z.any().optional(),
      rentalAgreement: z.any().optional(),
      propertyTaxReceipt: z.any().optional(),
      ownerName: z.preprocess((v) => v === undefined || v === null ? '' : String(v).trim(), z.string().max(100).optional()),
      ownerAadhaarFile: z.any().optional(),
      ownerMobile: z.preprocess((v) => !v ? '' : stripNonDigits(v), z.string().optional().refine((v) => !v || validateMobile(v), 'Invalid owner mobile')),
      witnessName: z.preprocess((v) => v === undefined || v === null ? '' : String(v).trim(), z.string().max(100).optional()),
      witnessAadhaarFile: z.any().optional(),
      witnessMobile: z.preprocess((v) => !v ? '' : stripNonDigits(v), z.string().optional().refine((v) => !v || validateMobile(v), 'Invalid witness mobile')),
      bankProof: z.any().optional(),
      remarks: z.preprocess((v) => v === undefined || v === null ? '' : String(v).trim(), z.string().max(500).optional()),
      consent: z.literal('true', { message: 'Please consent to use of documents.' }),
    }))
  );

  const {
    register, control, handleSubmit, formState: { errors, isValid, dirtyFields }, setValue, getValues, trigger, watch, clearErrors, setError,
  } = useForm({
    resolver: zodResolver(mainSchema),
    mode: 'onChange',
    criteriaMode: 'all',
    defaultValues: {
      consent: undefined,
    },
  });

  const premisesType = watch('premisesType');

  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const mandatoryFileFields = ['aadhaarCard', 'panCard', 'photo', 'electricityBill'];
  function hasMandatoryFiles() {
    const v = getValues();
    return mandatoryFileFields.every((k) => v[k] && v[k].file);
  }

  async function nextStep() {
    const valid = await triggerStepValidation();
    if (!valid) return;
    setErrorMsg('');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function prevStep() { setErrorMsg(''); setStep((s) => Math.max(0, s - 1)); }

  function applyZodIssuesToRHF(zodError) {
    if (!zodError?.issues) return;
    for (const issue of zodError.issues) {
      const field = issue.path?.[0];
      if (!field) continue;
      setError(field, {
        type: 'custom',
        message: issue.message,
      });
    }
  }

  async function triggerStepValidation() {
    const all = getValues();
    clearErrors();
    setErrorMsg('');

    if (step === 0) {
      const partial = {
        applicantName: all.applicantName || '',
        mobile: (all.mobile || '').toString().replace(/\D/g, ''),
        altMobile: all.altMobile ? all.altMobile.toString().replace(/\D/g, '') : '',
        email: all.email || '',
      };
      const res = applicantSchema.safeParse(partial);
      if (res.success) return true;
      applyZodIssuesToRHF(res.error);
      setErrorMsg('Please correct the highlighted fields before continuing.');
      return false;
    }

    if (step === 1) {
      const partial = {
        firmName: all.firmName || '',
        businessType: all.businessType,
        businessNature: all.businessNature || '',
        firmAddress: all.firmAddress || '',
        city: all.city || '',
        state: all.state,
        pincode: (all.pincode || '').toString().replace(/\D/g, ''),
        premisesType: all.premisesType,
      };
      const res = businessSchema.safeParse(partial);
      if (res.success) return true;
      applyZodIssuesToRHF(res.error);
      setErrorMsg('Please correct the highlighted fields before continuing.');
      return false;
    }

    if (step === 2) {
      const partial = {
        panNumber: (all.panNumber || '').toString().toUpperCase().replace(/[^A-Z0-9]/g, ''),
        aadhaarNumber: (all.aadhaarNumber || '').toString().replace(/\D/g, ''),
      };
      const res = docsSchema.safeParse(partial);
      const filesOk = hasMandatoryFiles();
      if (res.success && filesOk) return true;
      applyZodIssuesToRHF(res.error);
      if (!filesOk) {
        setErrorMsg('All 4 mandatory documents must be uploaded (Aadhaar, PAN, Photo, Electricity Bill).');
      } else {
        setErrorMsg('Please correct the highlighted fields before continuing.');
      }
      return false;
    }

    if (step === 3) {
      const partial = {
        ownerMobile: all.ownerMobile ? all.ownerMobile.toString().replace(/\D/g, '') : '',
        witnessMobile: all.witnessMobile ? all.witnessMobile.toString().replace(/\D/g, '') : '',
        remarks: all.remarks || '',
        consent: all.consent,
      };
      const res = optionalSchema.safeParse(partial);
      if (res.success) return true;
      applyZodIssuesToRHF(res.error);
      setErrorMsg('Please correct the highlighted fields before submitting.');
      return false;
    }
    return true;
  }

  const f_applicantName = register('applicantName');
  const f_mobile = register('mobile');
  const f_altMobile = register('altMobile');
  const f_email = register('email');
  const f_firmName = register('firmName');
  const f_businessType = register('businessType');
  const f_businessNature = register('businessNature');
  const f_firmAddress = register('firmAddress');
  const f_city = register('city');
  const f_state = register('state');
  const f_pincode = register('pincode');
  const f_panNumber = register('panNumber');
  const f_aadhaarNumber = register('aadhaarNumber');
  const f_ownerName = register('ownerName');
  const f_ownerMobile = register('ownerMobile');
  const f_witnessName = register('witnessName');
  const f_witnessMobile = register('witnessMobile');
  const f_remarks = register('remarks');
  const f_consent = register('consent');

  const ff_aadhaar = useFileField({ setValue, watch, fieldName: 'aadhaarCard' });
  const ff_pan = useFileField({ setValue, watch, fieldName: 'panCard' });
  const ff_photo = useFileField({ setValue, watch, fieldName: 'photo' });
  const ff_electricity = useFileField({ setValue, watch, fieldName: 'electricityBill' });
  const ff_rental = useFileField({ setValue, watch, fieldName: 'rentalAgreement' });
  const ff_propertyTax = useFileField({ setValue, watch, fieldName: 'propertyTaxReceipt' });
  const ff_ownerAadhaar = useFileField({ setValue, watch, fieldName: 'ownerAadhaarFile' });
  const ff_witnessAadhaar = useFileField({ setValue, watch, fieldName: 'witnessAadhaarFile' });
  const ff_bankProof = useFileField({ setValue, watch, fieldName: 'bankProof' });

  async function onSubmit(values) {
    if (!hasMandatoryFiles()) {
      setErrorMsg('Missing mandatory documents.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const fd = new FormData();
      const rawValues = getValues();
      const docKeyMap = {
        aadhaarCard: 'aadhaarCard', panCard: 'panCard', photo: 'photo', electricityBill: 'electricityBill',
        rentalAgreement: 'rentalAgreement', propertyTaxReceipt: 'propertyTaxReceipt',
        ownerAadhaarFile: 'ownerAadhaarFile', witnessAadhaarFile: 'witnessAadhaarFile', bankProof: 'bankProof',
      };
      for (const [fk, formKey] of Object.entries(docKeyMap)) {
        if (rawValues[fk]?.file) {
          const fileObj = rawValues[fk].file;
          const origName = rawValues[fk].originalName || fileObj.name || 'file';
          const ext = origName.includes('.') ? '' : (fileObj.type === 'application/pdf' ? '.pdf' : fileObj.type === 'image/png' ? '.png' : '.jpg');
          fd.append(formKey, fileObj, origName + ext);
        }
      }
      const textFields = [
        'applicantName','mobile','altMobile','email','firmName','businessType','businessNature',
        'firmAddress','city','state','pincode','premisesType','panNumber','aadhaarNumber',
        'ownerName','ownerMobile','witnessName','witnessMobile','remarks','consent',
      ];
      for (const k of textFields) {
        let v = values[k];
        if (v === undefined || v === null) continue;
        if (k === 'mobile' || k === 'altMobile' || k === 'ownerMobile' || k === 'witnessMobile') v = String(v).replace(/\D/g, '');
        if (k === 'aadhaarNumber') v = String(v).replace(/\D/g, '');
        if (k === 'pincode') v = String(v).replace(/\D/g, '');
        if (k === 'consent') v = 'true';
        fd.append(k, v);
      }
      fd.append('source', 'website');
      const { data } = await api.post('/api/gst/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 5 * 60 * 1000,
      });
      localStorage.removeItem(STORAGE_KEY);
      onSuccess?.(data);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.error || e.message || 'Submission failed';
      const issues = e?.response?.data?.issues;
      let msgOut = msg;
      if (Array.isArray(issues)) {
        const parts = issues.map((x) => `${x.param || x.path?.[0] || 'field'}: ${x.msg}`).slice(0, 5).join('; ');
        if (parts) msgOut += ' — ' + parts;
      }
      setErrorMsg(msgOut);
    } finally {
      setSubmitting(false);
    }
  }

  const mobileTransform = {
    onInput: (e) => { e.target.value = formatMobileInput(e.target.value); f_mobile.onChange(e); },
  };
  const altMobileTransform = {
    onInput: (e) => { e.target.value = formatMobileInput(e.target.value); f_altMobile.onChange(e); },
  };
  const pinTransform = {
    onInput: (e) => { e.target.value = formatPincode(e.target.value); f_pincode.onChange(e); },
  };
  const panTransform = {
    onInput: (e) => { e.target.value = formatPan(e.target.value); f_panNumber.onChange(e); },
  };
  const aadhaarTransform = {
    onInput: (e) => { e.target.value = formatAadhaarInput(e.target.value); f_aadhaarNumber.onChange(e); },
  };
  const ownerMobileT = { onInput: (e) => { e.target.value = formatMobileInput(e.target.value); f_ownerMobile.onChange(e); } };
  const witnessMobileT = { onInput: (e) => { e.target.value = formatMobileInput(e.target.value); f_witnessMobile.onChange(e); } };

  return (
    <div className="card p-6 md:p-8">
      <div className="mb-8">
        <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-navy">GST Registration Form</h2>
        <p className="text-sm text-brand-muted mt-1">Fill in the details. Mobile &amp; Email and the 4 mandatory documents block submission; all others are optional.</p>
      </div>

      <ol className="flex items-center justify-between w-full mb-8 overflow-x-auto">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex items-center flex-1 min-w-0 last:flex-none">
              <div className="flex items-center gap-2 pr-3">
                <div className={`progress-dot ${active ? 'bg-brand-blue text-white shadow-sm' : done ? 'bg-brand-ok text-white' : 'bg-white text-brand-muted border-2 border-brand-line'}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${active ? 'text-brand-blue' : done ? 'text-brand-navy' : 'text-brand-muted'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 rounded-full ${done ? 'bg-brand-ok/60' : 'bg-brand-line'}`} />
              )}
            </li>
          );
        })}
      </ol>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit, (formErrors) => {
        console.error('Form validation failed:', formErrors);
        const firstField = Object.keys(formErrors)[0];
        if (firstField) {
          const err = formErrors[firstField];
          setErrorMsg(`Please review the highlighted fields.${err?.message ? ` (${firstField}: ${err.message})` : ''}`);
        } else {
          setErrorMsg('Please review the form for highlighted errors before submitting.');
        }
      })}>
        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label-required">Applicant Full Name</label>
              <input {...f_applicantName} />
              {errors.applicantName && <div className="field-error">{errors.applicantName.message}</div>}
            </div>
            <div>
              <label className="label-required">Mobile Number (10-digit)</label>
              <input {...f_mobile} {...mobileTransform} />
              {errors.mobile && <div className="field-error">{errors.mobile.message}</div>}
            </div>
            <div>
              <label>Alternate Mobile <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input {...f_altMobile} {...altMobileTransform} />
              {errors.altMobile && <div className="field-error">{errors.altMobile.message}</div>}
            </div>
            <div>
              <label className="label-required">Email ID</label>
              <input type="email" {...f_email} />
              {errors.email && <div className="field-error">{errors.email.message}</div>}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="label-required">Firm / Business Name</label>
              <input {...f_firmName} />
              {errors.firmName && <div className="field-error">{errors.firmName.message}</div>}
            </div>
            <div>
              <label className="label-required">Constitution of Business</label>
              <select {...f_businessType}>
                <option value="">Select…</option>
                {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              {errors.businessType && <div className="field-error">{errors.businessType.message}</div>}
            </div>
            <div>
              <label>Nature of Business <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input {...f_businessNature} />
            </div>
            <div className="md:col-span-2">
              <label className="label-required">Firm Full Address</label>
              <textarea rows="3" {...f_firmAddress} />
              {errors.firmAddress && <div className="field-error">{errors.firmAddress.message}</div>}
            </div>
            <div>
              <label className="label-required">City</label>
              <input {...f_city} />
              {errors.city && <div className="field-error">{errors.city.message}</div>}
            </div>
            <div>
              <label className="label-required">State</label>
              <select {...f_state}>
                <option value="">Select…</option>
                {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <div className="field-error">{errors.state.message}</div>}
            </div>
            <div>
              <label className="label-required">PIN Code</label>
              <input placeholder="500001" {...f_pincode} {...pinTransform} />
              {errors.pincode && <div className="field-error">{errors.pincode.message}</div>}
            </div>
            <div>
              <label className="label-required">Premises Type</label>
              <div className="flex gap-3 pt-2">
                {['Owned','Rented'].map(t => (
                  <label key={t} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-brand-line cursor-pointer has-[:checked]:border-brand-blue has-[:checked]:bg-brand-bgSoft">
                    <input type="radio" {...register('premisesType')} value={t} className="peer accent-brand-blue" />
                    <span className="text-sm font-semibold peer-checked:text-brand-blue">{t}</span>
                  </label>
                ))}
              </div>
              {errors.premisesType && <div className="field-error">{errors.premisesType.message}</div>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label-required">PAN Number</label>
              <input placeholder="ABCDE1234F" {...f_panNumber} {...panTransform} />
              {errors.panNumber && <div className="field-error">{errors.panNumber.message}</div>}
            </div>
            <div>
              <label className="label-required">Aadhaar Number (12-digit)</label>
              <input placeholder="XXXX XXXX XXXX" {...f_aadhaarNumber} {...aadhaarTransform} />
              {errors.aadhaarNumber && <div className="field-error">{errors.aadhaarNumber.message}</div>}
            </div>

            <FormFileUpload {...ff_aadhaar} label="Aadhaar Card (front & back or PDF)" required error={!ff_aadhaar.file && errorMsg ? 'Upload required' : ''} />
            <FormFileUpload {...ff_pan} label="PAN Card" required error={!ff_pan.file && errorMsg ? 'Upload required' : ''} />
            <FormFileUpload {...ff_photo} label="Passport-size Photo" required hint="Face photo, JPG/PNG up to 5MB" error={!ff_photo.file && errorMsg ? 'Upload required' : ''} />
            <FormFileUpload {...ff_electricity} label="Latest Electricity Bill (Office / Business)" required error={!ff_electricity.file && errorMsg ? 'Upload required' : ''} />
          </div>
        )}

        {step === 3 && (
          <div className="grid md:grid-cols-2 gap-6">
            <FormFileUpload {...ff_rental} label="Rental Agreement" optional hint={premisesType === 'Rented' ? 'Recommended for rented premises' : 'If applicable'} />
            <FormFileUpload {...ff_propertyTax} label="Latest Property Tax Receipt" optional />
            <div>
              <label>Owner Name <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input {...f_ownerName} />
            </div>
            <div>
              <label>Owner Mobile <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input placeholder="98765-43210" {...f_ownerMobile} {...ownerMobileT} />
              {errors.ownerMobile && <div className="field-error">{errors.ownerMobile.message}</div>}
            </div>
            <div className="md:col-span-2">
              <FormFileUpload {...ff_ownerAadhaar} label="Owner Aadhaar Card" optional />
            </div>
            <div>
              <label>Witness Name <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input {...f_witnessName} />
            </div>
            <div>
              <label>Witness Mobile <span className="text-brand-muted text-xs font-medium">(Optional)</span></label>
              <input placeholder="98765-43210" {...f_witnessMobile} {...witnessMobileT} />
              {errors.witnessMobile && <div className="field-error">{errors.witnessMobile.message}</div>}
            </div>
            <div className="md:col-span-2">
              <FormFileUpload {...ff_witnessAadhaar} label="Witness Aadhaar Card" optional />
            </div>
            <div className="md:col-span-2">
              <FormFileUpload {...ff_bankProof} label="Bank Proof (Cancelled Cheque / Statement)" optional />
            </div>
            <div className="md:col-span-2">
              <label>Remarks <span className="text-brand-muted text-xs font-medium">(Optional, max 500 chars)</span></label>
              <textarea rows="3" {...f_remarks} />
              {errors.remarks && <div className="field-error">{errors.remarks.message}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-brand-line bg-brand-bgSoft">
                <input {...f_consent} type="checkbox" value="true" className="mt-0.5 w-5 h-5 accent-brand-blue" />
                <span className="text-sm text-brand-text leading-relaxed">
                  I authorise <b>SS Tax Mentors</b> to use these documents and information for the purpose of my GST registration and related communications.
                  I have read and agree to the <a href="/privacy" target="_blank" className="text-brand-blue underline">Privacy Policy</a>.
                </span>
              </label>
              {errors.consent && <div className="field-error mt-2">{errors.consent.message}</div>}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-brand-muted">
            <Shield className="w-4 h-4 text-brand-ok" />
            Your details are encrypted in transit and at rest. PAN/Aadhaar never shared in full.
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button type="button" onClick={prevStep} disabled={step === 0 || submitting} className="btn-secondary disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary min-w-[180px]">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
