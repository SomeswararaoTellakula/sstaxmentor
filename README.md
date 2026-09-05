# SS Tax Mentors — GST Registration Module

Production-ready, theme-matched **GST Registration** module for [sstaxmentors.com](https://sstaxmentors.com).
Built as a React + Express monorepo backed by **MongoDB**, with document uploads, auto-PDF generation, Google Sheets sync,
SMTP email delivery, and **Meta WhatsApp Cloud API** template messages — all behind the same blue/white SS Tax Mentors look.

---

## 1. Quick start (fresh clone)

```bash
# 1) Backend
cd server
cp .env.example .env                       # fill values in (see §3)
npm install
npm run seed:admin                         # creates admin@sstaxmentors.com / ChangeMe123!
npm run dev                                # http://localhost:5000

# 2) Frontend (new terminal)
cd ../client
npm install
npm run dev                                # http://localhost:5173
```

Open http://localhost:5173/gst-registration for the landing page.

---

## 2. Monorepo layout

```
sstax-gst/
├── client/          React 18 + Vite + React Router + Tailwind + react-hook-form + zod
│   └── src/
│       ├── pages/   Home, GstRegistration (hero + 4-step wizard + success), TrackApplication, AdminLogin, AdminDashboard, Privacy, Contact
│       ├── components/  Header, Footer, Layout, StatChip, FormFileUpload, GstForm
│       └── lib/     api.js (axios), utils.js, formatters.js (PAN/Aadhaar/masks + checksum)
└── server/          Node 20 + Express
    └── src/
        ├── app.js                entry point, helmet, cors, cron retry job
        ├── config/               db, cloudinary, sheets, mailer, whatsapp
        ├── models/               GstRegistration, Counter, AdminUser
        ├── controllers/          registrationController, adminController
        ├── services/             storage, pdf, sheets, mail, whatsapp
        ├── middleware/           upload (multer + MIME verify), errorHandler, rateLimiter, auth (JWT cookie)
        ├── routes/               gstRoutes, adminRoutes
        ├── scripts/seedAdmin.js
        └── utils/                encryption.js (AES-256-GCM), validators.js, logger.js
```

---

## 3. Environment variables

Copy `server/.env.example` → `.env` and fill the keys you need. Below is the meaning of each block.

### 3.1 Core

| Key | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default 5000) |
| `APP_BASE_URL` | Frontend origin, e.g. `https://sstaxmentors.com` — used inside emails/WhatsApp links |
| `API_BASE_URL` | API origin (used only for resolving local upload URLs) |

### 3.2 Database & auth

| Key | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. MongoDB Atlas cluster works fine: `mongodb+srv://user:pass@cluster.mongodb.net/sstax_gst` |
| `FIELD_ENCRYPTION_KEY` | **64-char (32-byte) hex key** for AES-256-GCM encryption of Aadhaar at rest. Generate with `openssl rand -hex 32`. |
| `JWT_SECRET` | Long random string for signing admin JWTs. |
| `ADMIN_EMAIL_LOGIN` / `ADMIN_PASSWORD` | Seeded superadmin credentials used by `npm run seed:admin`. |

### 3.3 File storage (Cloudinary)

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE_MB=5
```

**Dev fallback:** if Cloudinary credentials are missing, files are saved to `server/public/uploads/` (served at `/uploads/`).
Everything in the UI works the same because document access goes through a single `storageService.js`.

### 3.4 Google Sheets sync

1. Go to https://console.cloud.google.com → create a project → enable **Google Sheets API**.
2. **IAM & Admin → Service Accounts → Create Service Account** → download JSON key.
3. Copy the `client_email` from the JSON and set `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
4. Copy the `private_key` exactly, **with the literal `\n` characters preserved inside double quotes** (nodemailer-style):
   ```
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n...\n-----END PRIVATE KEY-----\n"
   ```
5. Create a new Google Sheet. Copy the long ID from the URL (between `/d/` and `/edit`):
   ```
   GOOGLE_SHEETS_ID=1AbCd...xyz
   ```
6. In the Sheet: **Share → Add the service-account email as Editor**.
7. (Optional) Rename the tab to `GST Registrations` or set `GOOGLE_SHEET_TAB=YourTab`.

The backend writes column headers on first insert, appends one row per submission, and **updates the Status / ARN / GSTIN columns in place**
when an admin edits them in the dashboard. Aadhaar is always written **masked** (`XXXX XXXX 1234`); document cells are
`=HYPERLINK("signed-url","View")`.

### 3.5 Email (SMTP — Gmail example)

We use **Nodemailer** with your SMTP host. For Gmail, create an **App Password** (2FA must be ON):

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=sstax9646@gmail.com`
- `SMTP_PASS=your-gmail-app-password`
- `MAIL_FROM="SS Tax Mentors <sstax9646@gmail.com>"`
- `ADMIN_EMAIL=sstax9646@gmail.com` (gets the "🔔 New GST Registration" alert for every submission)

Two emails are sent per submission:
- **To applicant** — responsive HTML in the SS Tax theme, PDF attached, "Track your application" pill button.
- **To admin** — full detail table + per-document hyperlinks + PDF + dashboard link.

### 3.6 WhatsApp (Meta Cloud API)

Because you are messaging a user who has **not** messaged you first, free-form text is rejected outside the 24-hour window.
You **must** submit pre-approved **template** messages in Meta Business Manager → WhatsApp Manager → Templates.

| Template name (suggested) | Category | Body | Header | Button |
|---|---|---|---|---|
| `gst_registration_received` | UTILITY | Hi {{1}} — we received your GST registration (ID {{2}}) for {{3}}. We will update you on every step. | **Document** header (used to deliver the PDF attachment) | Website URL button → `/track/{{1}}` (uses URL button param) |
| `gst_status_update` | UTILITY | Hi {{1}} — application {{2}} is now {{3}}. Call us for queries. | — | — |
| `gst_arn_generated` | UTILITY | Hi {{1}} — ARN {{2}} has been generated for your application {{3}}. | — | — |

After the templates are **approved**, set:
```
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_API_VERSION=v20.0
WA_TEMPLATE_RECEIVED=gst_registration_received
WA_TEMPLATE_STATUS=gst_status_update
WA_TEMPLATE_ARN=gst_arn_generated
ADMIN_WHATSAPP=918179726723     # just digits, country code first, no + or spaces
```

If WhatsApp credentials are missing the whole submission still succeeds (HTTP 201); the API response records `whatsappSent.ok=false`
and the 15-minute cron retry job will retry up to 3 times.

---

## 4. GST Registration page (`/gst-registration`)

Top → bottom:

1. **Hero banner (echoes the Instagram ad)** — kicker line `IMPORTANT COMPLIANCE REQUIREMENT`,
   giant `GST REGISTRATION` headline, amber deadline chip `APPLY IN 3 WORKING DAYS`,
   mixed amber+navy sub-headline, right rail `TRUSTED BY 500+ CLIENTS` with star accents,
   3 circular icon badges (Handled by Experts / Tracked Until Approval / Verified Before Filing),
   navy phone strip, and a **brand-blue full-width CTA bar** replacing the green WhatsApp bar.
2. **"Documents required" two-card checklist** — Left = Mandatory (Aadhaar, PAN, Photo, Firm Name, Address, Electricity Bill);
   Right = Contact & Optional (Mobile ✅, Email ✅, Rental / Owner / Witness / Property Tax all tagged grey `Optional` pills).
3. **4-step form wizard** with progress bar, per-step validation, and localStorage draft persistence:
   - Step 1 — Applicant (Name, Mobile ✅, Alt, Email ✅)
   - Step 2 — Business (Firm name ✅, type, nature, address ✅, city ✅, state ✅, PIN ✅, Owned/Rented ✅)
   - Step 3 — PAN & Aadhaar numbers + 4 mandatory uploads (Aadhaar, PAN, Photo, Electricity Bill)
   - Step 4 — Rental agreement, Property tax, Owner name/mobile/aadhaar, Witness name/mobile/aadhaar, Bank proof, Remarks, Consent checkbox

### 4.1 Mandatory vs optional enforcement (user requirement)

Per your brief:
- **Left-side SS Tax Mentors brand / hero image is mandatory** (hard-coded into the landing hero — always shown).
- **Mobile & Email are mandatory** (block submission via RHF + zod + server validation).
- **Everything else (Rental, Owner, Witness, Property Tax, Remarks, Bank Proof) is optional** (none of them block the wizard or submission).

### 4.2 Upload behaviour

- Accepted formats: JPG, PNG, PDF only; **max 5 MB each**.
- Files > 1 MB are auto-compressed in the browser with `browser-image-compression` before upload.
- Server re-validates MIME type using `file-type` (not just extension) and strips EXIF metadata with `sharp`.
- Inline thumbnail chip, progress bar, and remove button are shown per file.

### 4.3 Submit behaviour

1. Wizard validates all text fields on the server too.
2. MongoDB record is saved **first** under a race-safe atomic counter → `SSTM-GST-YYYY-NNNNN`.
3. Acknowledgement PDF is generated via `pdfkit` (A4, masked Aadhaar, photo embedded, "what happens next", brand header/footer)
   and uploaded alongside other documents.
4. **Sheets / Email / WhatsApp / Admin notifications run via `Promise.allSettled`** — any failure is recorded
   (`ok:false`, `error:…`, `attempts:1`) but HTTP still returns 201.
5. Frontend:
   - Shows success screen with the Application ID, per-channel status badges (Saved ✓ Email ✓ WhatsApp ✓).
   - **Auto-triggers PDF download** (`fetch` → blob → `<a download>` click) with a manual fallback button for popup blockers.

---

## 5. Track status page (`/track/:id`)

- Search box accepts an Application ID.
- Results show Status badge, Applicant/Firm/Contact summary, **vertical timeline** with green checkmarks for completed stages
  (Submitted → Under Review → Filed → ARN Generated → Approved), and links to Email / Call / WhatsApp support.

---

## 6. Admin dashboard (`/admin`)

- **JWT cookie auth** (httpOnly + secure + SameSite in prod). Seed via `npm run seed:admin`.
- **Stats strip**: total, this month, under review, approved.
- **Searchable / filterable table** (name, firm, mobile, App ID; status filter; date range; CSV export).
- **Detail drawer** opens per row: all fields (incl. decrypted Aadhaar shown only to admins), per-document thumbnails with lightbox,
  signed URLs for every file & PDF, status/ARN/GSTIN/notes editors with autosave on blur, delivery-status chips with per-channel **Retry** buttons,
  and a red **Delete record & purge files** action (DPDP right-to-erasure).
- **Cron job** (every 15 minutes) automatically retries failed Google Sheets / Email / WhatsApp up to 3 times each.

---

## 7. Security & compliance (non-negotiable)

- **Aadhaar encryption at rest**: AES-256-GCM via `FIELD_ENCRYPTION_KEY`. Field has `select:false` by default; decrypted only in admin detail endpoint.
- **Aadhaar masking rule**: the full number is **never** displayed, logged, emailed, WhatsApp'd, exported to PDF, or synced to Google Sheets —
  only `XXXX XXXX 1234` is shown/shared.
- **Document privacy**: Cloudinary signed URLs with 15-minute expiry; never public.
- **Helmet** with a locked-down CSP (Google Fonts, Cloudinary, Graph API explicitly allowed).
- **CORS** locked to your site origin (cookie auth would break over mismatched origins anyway).
- **Rate limits**: 5 registrations/hour/IP; 10 login attempts/15 min; 30 track lookups/min.
- `express-mongo-sanitize` + JSON / URL body size limits.
- **Redacted logger** (winston) that automatically scrubs Aadhaar-looking strings from logs.
- **Consent checkbox** on step 4 with a link to `/privacy` (the included Privacy Policy page explains DPDPA rights, retention, and data deletion procedure).
- **Data retention & deletion**: Admin "delete record & purge files" button + Privacy Policy notice (DPDP Act 2023 purpose-limitation / deletion-on-request).

---

## 8. Acceptance test checklist

1. ✅ Submit with only the mandatory fields (name, mobile, email, firm name + address + city + state + PIN + premises + PAN + Aadhaar + 4 documents) → Success.
2. ❌ Omit the mobile → inline error on step 1, wizard blocked.
3. ❌ Invalid PAN `NOTAPAN00X` → client + server reject.
4. ❌ Invalid Aadhaar `0000 0000 0000` → Verhoeff checksum fails client + server.
5. ❌ 9-digit mobile / 5-digit PIN → rejected.
6. ❌ Attach a 7 MB file → rejected (both `MulterError` limits and client-side checks).
7. ✅ Record appears in MongoDB with a gapless `SSTM-GST-YYYY-NNNNN` counter.
8. ✅ Google Sheet row appended with HYPERLINK document links and masked Aadhaar.
9. ✅ PDF auto-downloads on success; fallback manual button also works.
10. ✅ Applicant receives themed email with PDF attachment; `ADMIN_EMAIL` receives the alert mail.
11. ✅ Applicant & admin receive the WhatsApp template message with PDF header.
12. 🟰 Disable SMTP → submission still returns HTTP 201; `delivery.emailSent.ok=false` stored; no data loss; retry job picks it up.
13. ✅ Page renders correctly at 360 / 768 / 1440 px; theme matches sstaxmentors.com blue/white hero, pill buttons, stat chips.

---

## 9. Deployment notes (opinionated defaults)

| Tier | Recommendation |
|---|---|
| Frontend | Vercel — the `client/` directory alone is a standard Vite app. Set `VITE_API_URL=https://api.yourdomain.com` during build. Point `/gst-registration` in production to this build. |
| Backend | Render / Railway / Fly.io (Node 20 + `npm start`). Attach a persistent `/uploads` disk only if you use the *local storage fallback* (otherwise Cloudinary handles persistence). |
| DB | MongoDB Atlas M0 is plenty to start. Allow inbound from your backend region IPs, enable backups, turn on field-level audit logs. |
| WhatsApp | Monitor **template quality** and **phone-number quality** in Meta Manager daily during launch week; high bounce/block rates degrade quality score. |

### Adding the route into your existing WordPress/Next site

If the existing sstaxmentors.com is a CMS, point just `GET /gst-registration` and the SPA sub-routes (`/track/*`, `/admin/*`)
at this Vercel deployment with a proxy/rewrite rule — or just host everything together under one deploy. Either works because all
assets are namespaced and the API is `/api/*`.

---

## 10. Postman collection (quick recipes)

Import these requests manually or create `sstax-gst.postman_collection.json`:

1. `POST /api/gst/register` — `multipart/form-data`:
   - 4 file fields `aadhaarCard`, `panCard`, `photo`, `electricityBill`.
   - Text fields: `applicantName`, `mobile`, `email`, `firmName`, `businessType`, `firmAddress`, `city`, `state`, `pincode`, `premisesType`, `panNumber`, `aadhaarNumber`, `consent=true`.
2. `GET  /api/gst/SSTM-GST-2026-00001/pdf` → stream/download.
3. `GET  /api/gst/track/SSTM-GST-2026-00001` → public status.
4. `POST /api/admin/login` JSON `{email, password}` → sets `admin_token` httpOnly cookie.
5. `GET  /api/admin/registrations?page=1&status=Submitted&q=Firm` → list.
6. `PATCH /api/admin/registrations/SSTM-GST-2026-00001` JSON `{status, arn, gstin, internalNotes}`.
7. `POST /api/admin/registrations/SSTM-GST-2026-00001/resend` JSON `{channel: 'whatsapp' | 'email' | 'sheet'}`.
8. `GET  /api/admin/registrations/export` → downloads CSV.

---

## 11. Help & support

If a delivery channel fails, inspect `server/logs/combined.log` (production) or the console and look for the per-channel `error` message.
90% of cases are:
- Google sheets 429 → wait + auto retry.
- Gmail App Password wrong / 2FA off → recreate the App Password.
- WhatsApp template not approved yet → wait for Meta approval or use AiSensy/Interakt alternative.

**Swapping WhatsApp providers (AiSensy):** `server/src/config/whatsapp.js` contains a commented-out AiSensy adapter.
Replace the body of `services/whatsappService.js` `sendTemplate` with one call to it — one-file swap.

---

Made for **SS Tax Mentors · Reach Us & Relax**.
