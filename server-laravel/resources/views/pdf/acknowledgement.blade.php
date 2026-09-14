<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0B1B3A; font-size: 11px; }
        .header { background: #1A4FD6; color: #fff; padding: 18px; }
        h1 { text-align: center; font-size: 18px; margin: 24px 0; }
        h2 { color: #1A4FD6; font-size: 13px; border-bottom: 1px solid #1A4FD6; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td { padding: 6px; border-bottom: 1px solid #E5E7EB; }
        td:first-child { width: 35%; color: #6B7280; }
        .footer { margin-top: 28px; color: #6B7280; font-size: 9px; text-align: center; }
    </style>
</head>
<body>
    <div class="header"><strong>SS TAX MENTORS</strong><br>Reach Us &amp; Relax</div>
    <h1>GST Registration - Application Acknowledgement</h1>
    <h2>1. Applicant Details</h2>
    <table>
        <tr><td>Application ID</td><td>{{ $registration->application_id }}</td></tr>
        <tr><td>Applicant Name</td><td>{{ $registration->applicant_name }}</td></tr>
        <tr><td>Mobile Number</td><td>{{ $registration->mobile }}</td></tr>
        <tr><td>Email ID</td><td>{{ $registration->email }}</td></tr>
    </table>
    <h2>2. Business Details</h2>
    <table>
        <tr><td>Firm / Business Name</td><td>{{ $registration->firm_name }}</td></tr>
        <tr><td>Constitution</td><td>{{ $registration->business_type }}</td></tr>
        <tr><td>Address</td><td>{{ $registration->firm_address }}, {{ $registration->city }}, {{ $registration->state }} - {{ $registration->pincode }}</td></tr>
        <tr><td>Premises Type</td><td>{{ $registration->premises_type }}</td></tr>
        <tr><td>PAN</td><td>{{ $registration->pan_number }}</td></tr>
        <tr><td>Aadhaar</td><td>{{ $registration->maskedAadhaar() }}</td></tr>
    </table>
    <h2>3. Documents Received</h2>
    <table>
        @foreach ($registration->documents ?? [] as $key => $document)
            <tr><td>{{ $key }}</td><td>Received - {{ $document['originalName'] ?? '' }}</td></tr>
        @endforeach
    </table>
    <h2>What happens next?</h2>
    <p>Our team verifies documents, files the application on the GST Portal, and shares ARN and GSTIN updates over email and WhatsApp.</p>
    <div class="footer">This is a computer-generated acknowledgement and is not a GST registration certificate.</div>
</body>
</html>
