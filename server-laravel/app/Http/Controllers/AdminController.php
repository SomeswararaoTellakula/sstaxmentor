<?php

namespace App\Http\Controllers;

use App\Models\GstRegistration;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private const STATUSES = ['Submitted','Under Review','Documents Pending','Filed','ARN Generated','Approved','Rejected'];

    public function login(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string', 'min:6']]);
        $admin = User::where('email', strtolower($data['email']))->first();
        if (!$admin || !Hash::check($data['password'], $admin->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token = $admin->createToken('admin')->plainTextToken;
        return response()->json([
            'ok' => true,
            'admin' => ['email' => $admin->email, 'name' => $admin->name, 'role' => $admin->role ?? 'admin'],
        ])->cookie('admin_token', $token, 480, '/', null, app()->environment('production'), true, false, 'lax');
    }

    public function logout(Request $request)
    {
        $request->user()?->tokens()->delete();
        return response()->json(['ok' => true])->withoutCookie('admin_token');
    }

    public function me(Request $request)
    {
        return response()->json(['ok' => true, 'admin' => [
            'email' => $request->user()->email,
            'name' => $request->user()->name,
            'role' => $request->user()->role ?? 'admin',
        ]]);
    }

    public function index(Request $request)
    {
        $perPage = min(100, max(1, (int) $request->query('perPage', 20)));
        $query = GstRegistration::query();
        if (in_array($request->query('status'), self::STATUSES, true)) $query->where('status', $request->query('status'));
        if ($request->filled('q')) {
            $term = trim($request->query('q'));
            $query->where(fn ($q) => $q->where('applicant_name', 'like', "%{$term}%")
                ->orWhere('firm_name', 'like', "%{$term}%")
                ->orWhere('application_id', 'like', "%{$term}%")
                ->orWhere('mobile', 'like', "%{$term}%"));
        }
        $paginator = $query->latest()->paginate($perPage);
        return response()->json([
            'count' => $paginator->total(), 'page' => $paginator->currentPage(), 'perPage' => $paginator->perPage(),
            'items' => $paginator->items(),
        ]);
    }

    public function show(string $id)
    {
        $registration = $this->findRegistration($id);
        if (!$registration) return response()->json(['error' => 'Not found'], 404);
        $data = $registration->toArray();
        $data['aadhaarFull'] = $registration->getDecryptedAadhaar();
        $data['aadhaarMasked'] = $registration->maskedAadhaar();
        return response()->json($data);
    }

    public function update(Request $request, string $id)
    {
        $registration = $this->findRegistration($id);
        if (!$registration) return response()->json(['error' => 'Not found'], 404);
        $changes = $request->validate([
            'status' => ['nullable', 'in:'.implode(',', self::STATUSES)],
            'arn' => ['nullable', 'string', 'max:100'],
            'gstin' => ['nullable', 'string', 'max:100'],
            'internalNotes' => ['nullable', 'string', 'max:2000'],
        ]);
        $registration->fill([
            'status' => $changes['status'] ?? $registration->status,
            'arn' => $changes['arn'] ?? $registration->arn,
            'gstin' => $changes['gstin'] ?? $registration->gstin,
            'internal_notes' => $changes['internalNotes'] ?? $registration->internal_notes,
        ])->save();
        return response()->json(['ok' => true, 'updated' => $changes]);
    }

    public function stats()
    {
        $map = array_fill_keys(self::STATUSES, 0);
        GstRegistration::selectRaw('status, count(*) as total')->groupBy('status')->get()->each(fn ($row) => $map[$row->status] = $row->total);
        return response()->json(['total' => GstRegistration::count(), 'thisMonth' => GstRegistration::whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(), 'byStatus' => $map]);
    }

    public function export(Request $request)
    {
        $items = GstRegistration::when(in_array($request->query('status'), self::STATUSES, true), fn ($q) => $q->where('status', $request->query('status')))->latest()->get();
        $headers = ['Submitted At','Application ID','Status','Applicant','Mobile','Email','Firm','Type','City','State','PIN','PAN','Aadhaar (masked)','ARN','GSTIN'];
        $lines = [implode(',', $headers)];
        foreach ($items as $item) {
            $values = [$item->created_at?->toISOString(), $item->application_id, $item->status, $item->applicant_name, $item->mobile, $item->email, $item->firm_name, $item->business_type, $item->city, $item->state, $item->pincode, $item->pan_number, $item->maskedAadhaar(), $item->arn, $item->gstin];
            $lines[] = implode(',', array_map(fn ($value) => '"'.str_replace('"', '""', (string) $value).'"', $values));
        }
        return response("\xEF\xBB\xBF".implode("\n", $lines), 200, ['Content-Type' => 'text/csv; charset=utf-8', 'Content-Disposition' => 'attachment; filename=gst-registrations.csv']);
    }

    public function resend() { return response()->json(['ok' => false, 'error' => 'Delivery integrations are not configured in Laravel yet'], 501); }
    public function destroy(string $id)
    {
        $registration = $this->findRegistration($id);
        if (!$registration) return response()->json(['error' => 'Not found'], 404);
        $registration->delete();
        return response()->json(['ok' => true]);
    }

    private function findRegistration(string $id): ?GstRegistration
    {
        return GstRegistration::where('application_id', $id)->orWhere('id', $id)->first();
    }
}
