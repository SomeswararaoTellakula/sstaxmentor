import { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { fileSize } from '../lib/utils.js';

const ACCEPTED = ['image/jpeg','image/jpg','image/png','application/pdf'];
const ACCEPT_STR = 'image/jpeg,image/png,application/pdf';
const MAX_MB = 5;

export default function FormFileUpload({
  fieldName, label, required = false, optional = false, hint, accept = ACCEPT_STR,
  error, file, onSelect, onRemove, disabled, previewMode = false,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(fileLike) {
    if (!fileLike) return;
    if (!ACCEPTED.includes(fileLike.type) && !/(\.jpg|\.jpeg|\.png|\.pdf)$/i.test(fileLike.name || '')) {
      alert('Allowed files: JPG, PNG, PDF.');
      return;
    }
    if (fileLike.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setProgress(30);
    try {
      let finalFile = fileLike;
      if (/^image\/(jpe?g|png)$/i.test(fileLike.type) && fileLike.size > 1024 * 1024) {
        const compressed = await imageCompression(fileLike, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (p) => setProgress(Math.min(90, 30 + Math.round(p * 0.6))),
        });
        // Preserve original filename on compressed blob
        finalFile = new File([compressed], fileLike.name, { type: compressed.type });
      }
      setProgress(100);
      const objectUrl = URL.createObjectURL(finalFile);
      onSelect({
        file: finalFile,
        originalName: fileLike.name,
        sizeBytes: finalFile.size,
        type: finalFile.type,
        previewUrl: /^image\//.test(finalFile.type) ? objectUrl : null,
      });
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 300);
    }
  }

  const hasFile = !!file && (!!file.file || previewMode);
  const icon = hasFile && file?.type?.startsWith('image/') ? ImageIcon : FileText;
  const Icon = hasFile ? icon : Upload;

  return (
    <div>
      <label className={required ? 'label-required' : ''}>
        {label}
        {optional && <span className="ml-2 text-xs font-medium text-brand-muted bg-brand-line/70 px-2 py-0.5 rounded-full">Optional</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && !busy && inputRef.current?.click()}
        className={`doc-upload-box ${hasFile ? 'border-solid border-brand-blue bg-white' : ''} ${disabled ? 'opacity-60' : ''}`}
      >
        {!hasFile && (
          <>
            <div className="w-12 h-12 rounded-full bg-white border border-brand-line flex items-center justify-center mb-3">
              {busy ? <Loader2 className="w-5 h-5 animate-spin text-brand-blue" /> : <Upload className="w-5 h-5 text-brand-blue" />}
            </div>
            <div className="text-sm font-semibold text-brand-navy">
              {busy ? 'Processing…' : `Click to upload ${label}`}
            </div>
            <div className="text-xs text-brand-muted mt-1">{hint || `Max ${MAX_MB} MB · JPG, PNG, PDF`}</div>
            {progress > 0 && (
              <div className="w-full max-w-xs mt-3 h-1.5 rounded-full bg-brand-line overflow-hidden">
                <div className="h-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        )}
        {hasFile && (
          <div className="w-full flex items-center gap-4">
            {file.previewUrl ? (
              <img src={file.previewUrl} alt="" className="w-16 h-16 rounded-xl object-cover border border-brand-line" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-brand-bgSoft flex items-center justify-center border border-brand-line">
                <FileText className="w-6 h-6 text-brand-blue" />
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-brand-navy truncate">
                {file.originalName || (previewMode ? file?.originalName : 'Uploaded')}
              </div>
              <div className="text-xs text-brand-muted">{fileSize(file.sizeBytes) || fileSize(file?.size)}</div>
            </div>
            {!previewMode && !disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="btn-ghost p-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
