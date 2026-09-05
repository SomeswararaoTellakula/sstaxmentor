export default function Privacy() {
  return (
    <div className="section-wrap py-16 max-w-3xl prose prose-sm prose-headings:text-brand-navy">
      <p className="kicker mb-4">Privacy Policy</p>
      <h1 className="font-heading font-black text-4xl mb-6">Privacy &amp; Data Handling</h1>
      <p className="text-brand-muted leading-relaxed">
        SS Tax Mentors (“we”) is committed to protecting your privacy in line with the Digital Personal Data Protection Act, 2023 (DPDPA 2023).
        This page summarises how we collect, use and delete the information you provide via our GST registration module and website forms.
      </p>
      <h3>1. What we collect</h3>
      <p>When you submit the GST Registration form we collect applicant name, mobile, email, business details, PAN, Aadhaar and uploaded documents (images / PDFs). All information is used solely for the purpose of registration and compliance services you have requested and retained only as long as required for fulfilment and regulatory retention.</p>
      <h3>2. How we protect it</h3>
      <ul>
        <li>Aadhaar numbers are encrypted at rest with AES-256-GCM and never displayed, emailed, WhatsApp'd, or exported in full. Only the last 4 digits are shown / shared with staff where needed.</li>
        <li>Documents are stored on Cloudinary with short-lived signed URLs, never public.</li>
        <li>Server uses HTTPS, Helmet CSP, CORS lockdown, rate limiting and mongo sanitisation.</li>
      </ul>
      <h3>3. Sharing</h3>
      <p>We share documents only with authorised staff handling your filing, and with the GST portal as required by law. We never sell or rent your personal data.</p>
      <h3>4. Your rights (DPDPA 2023)</h3>
      <p>You have the right to access, correct, and request deletion of your personal data. To exercise these rights email someshtellakula@gmail.com from your registered email address quoting your Application ID. We will respond within 7 days and, upon verification, delete or anonymise all records and purge file uploads unless retention is required by law (e.g. ITR/GST records).</p>
      <h3>5. Consent</h3>
      <p>By ticking the consent checkbox on the GST form you authorise SS Tax Mentors to use submitted documents and data for the purpose of your GST registration and related communications (email, WhatsApp, SMS).</p>
      <h3>6. Grievance</h3>
      <p>For any privacy grievance, contact the Data Grievance Officer at someshtellakula@gmail.com with subject “Privacy Grievance”.</p>
    </div>
  );
}
