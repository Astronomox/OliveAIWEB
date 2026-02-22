# API Quick Reference - Medi-Sync AI

Fast lookup guide for common API operations.

## Import All Services

```typescript
import { 
    usersApi, 
    prescriptionsApi, 
    medicationsApi, 
    remindersApi, 
    drugsApi, 
    doctorsApi, 
    voiceApi 
} from "@/services/api";
import { getUserId, getToken, isAuthenticated } from "@/lib/auth";
```

## Common Operations

### Authentication

```typescript
// Register
usersApi.register({ phone_number, email, password, name, age, gender })

// Login
usersApi.login({ email, password })

// Get Profile
usersApi.getUser(userId)

// Update Profile
usersApi.updateUser(userId, { name, age, email })

// Logout
usersApi.logout()

// Check Auth
isAuthenticated()
getCurrentUser()
getToken()
```

### Prescriptions

```typescript
// Upload & OCR
prescriptionsApi.upload(userId, file, autoMatch)

// Create
prescriptionsApi.create(userId, { ocr_text, drugs })

// List
prescriptionsApi.getAll(userId)

// Get Single
prescriptionsApi.get(prescriptionId)

// Update
prescriptionsApi.update(prescriptionId, { status, verified_by_user })

// Add Drug
prescriptionsApi.addDrug(prescriptionId, { drug_name, dosage })

// Delete
prescriptionsApi.delete(prescriptionId)
```

### Medications

```typescript
// Create
medicationsApi.create(userId, {
    drug_name,
    dosage,
    frequency,
    start_date,
    reminder_times: ["HH:MM", "HH:MM"],
    side_effects
})

// List (filterable by status)
medicationsApi.getAll(userId, "active")

// Get Single
medicationsApi.get(medicationId)

// Update
medicationsApi.update(medicationId, { dosage, end_date, reminder_times })

// Record Compliance (user took it)
medicationsApi.recordCompliance(medicationId)

// Add Side Effect
medicationsApi.addSideEffect(medicationId, "headache")

// Delete
medicationsApi.delete(medicationId)
```

### Reminders

```typescript
// Create for Medication
remindersApi.create(medicationId, ["08:00", "20:00"])

// List (with filters)
remindersApi.getAll(userId, "pending", 7)  // status, days

// Get Stats
remindersApi.getStats(userId)

// Get Single
remindersApi.get(reminderId)

// Update
remindersApi.update(reminderId, { delivery_status, sent })

// Mark as Taken
remindersApi.markTaken(reminderId)

// Snooze
remindersApi.snooze(reminderId, 10)  // minutes

// Send All Pending
remindersApi.sendAllPending()

// Delete
remindersApi.delete(reminderId)
```

### Drugs

```typescript
// Search
drugsApi.search("paracetamol")

// Get Details
drugsApi.get("emdex-id")

// Get Generics
drugsApi.getGenerics("Paracetamol")

// Compare Prices
drugsApi.comparePrices("Paracetamol")

// Verify NAFDAC
drugsApi.verify({ reg_number: "A4-0123" })

// Sync Database (admin)
drugsApi.syncEmdex(false)
```

### Doctors

```typescript
// List (filterable)
doctorsApi.getAll({
    specialization: "Cardiology",
    location: "Lagos",
    availability_status: "available"
})

// Search
doctorsApi.search("cardiologist")

// Get Details
doctorsApi.get(doctorId)

// Get Specializations
doctorsApi.getSpecializations()

// Request Consultation
doctorsApi.requestConsultation(doctorId, {
    message: "...",
    urgency_level: "high"
})

// Get Consultation History
doctorsApi.getConsultations(userId)
```

### Voice

```typescript
// Transcribe Audio
voiceApi.transcribe(audioFile, "en")

// Text-to-Speech
voiceApi.synthesize("Please take your medication", {
    language: "en",
    speed: "normal",
    gender: "female",
    format: "mp3"
})

// Transcribe & Extract Data
voiceApi.transcribeAndProcess(audioFile, "en")

// Get Supported Languages
voiceApi.getSupportedLanguages()

// Health Check
voiceApi.testVoiceService()
```

### Browser Voice (Web Speech API)

```typescript
import { createSpeechRecognition, speakText } from "@/services/voice";

// Speech Recognition
const recognition = createSpeechRecognition({
    language: "en",
    onResult: (text, isFinal) => console.log(text),
    onStateChange: (state) => console.log(state),
    onError: (error) => console.error(error)
});
recognition?.start();

// Text-to-Speech
const speaker = speakText("Hello", {
    speed: "normal",
    onStart: () => console.log("Speaking..."),
    onEnd: () => console.log("Done")
});
speaker.cancel();
```

## Response Handling

### Standard Response
```typescript
const response = await usersApi.login(credentials);

if (response.error) {
    // Handle error
    console.error(response.error.message);
    if (response.status === 422) {
        console.error("Validation errors:", response.error.detail);
    }
} else {
    // Handle success
    console.log("Success:", response.data);
}
```

### Type Safe Usage
```typescript
const response = await medicationsApi.getAll(userId);
// response.data is MedicationResponse[] | null
// response.error is ApiError | null
// response.status is number
```

## Status Codes Quick Reference

| Code | Meaning | Action |
|------|---------|--------|
| 200-201 | Success | Use `response.data` |
| 204 | No content | Empty success response |
| 400 | Bad request | Check request format |
| 401 | Unauthorized | Auto-handled, redirects to /login |
| 404 | Not found | Resource doesn't exist |
| 422 | Validation error | Check `response.error.detail` |
| 500+ | Server error | Check backend logs |
| 0 | Network error | Check internet connection |

## Error Codes

```typescript
// Check error code
if (response.error?.code === 'TIMEOUT') {
    // Request timed out
}
if (response.error?.code === 'NETWORK_ERROR') {
    // Network unavailable
}
if (response.error?.code === 'SESSION_EXPIRED') {
    // Token refresh failed
}
```

## React Hook Pattern

```typescript
import { useEffect, useState } from "react";
import { medicationsApi } from "@/services/api";
import { getUserId } from "@/lib/auth";

export function MedicationList() {
    const [medications, setMedications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const userId = getUserId();

    useEffect(() => {
        async function fetch() {
            try {
                const response = await medicationsApi.getAll(userId!);
                if (response.error) {
                    setError(response.error.message);
                } else {
                    setMedications(response.data || []);
                }
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }
        
        fetch();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!medications.length) return <div>No medications</div>;

    return (
        <ul>
            {medications.map(med => (
                <li key={med.id}>{med.drug_name}</li>
            ))}
        </ul>
    );
}
```

## SWR Pattern

```typescript
import useSWR from "swr";
import { medicationsApi } from "@/services/api";
import { getUserId } from "@/lib/auth";

export function MedicationList() {
    const userId = getUserId();
    const { data: medications, error, isLoading } = useSWR(
        userId ? `/medications/${userId}` : null,
        async () => {
            const response = await medicationsApi.getAll(userId!);
            if (response.error) throw new Error(response.error.message);
            return response.data || [];
        }
    );

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <ul>
            {medications?.map(med => (
                <li key={med.id}>{med.drug_name}</li>
            ))}
        </ul>
    );
}
```

## File Upload Pattern

```typescript
// Image upload for prescription
const file = fileInputRef.current?.files?.[0];
if (!file) return;

const response = await prescriptionsApi.upload(userId, file);

if (response.error) {
    console.error("Upload failed:", response.error.message);
} else {
    console.log("OCR text:", response.data?.text);
    console.log("Detected drugs:", response.data?.drugs);
}
```

## Form Data Pattern

```typescript
// Don't manually create FormData — API client handles it
// Just pass the file directly

const audioFile = fileInput.files[0];
const response = await voiceApi.transcribe(audioFile, "en");
```

## Parallel Requests Pattern

```typescript
import { safeParallelFetch } from "@/lib/api";

const [meds, reminders, profile] = await safeParallelFetch([
    () => medicationsApi.getAll(userId).then(r => r.data || []),
    () => remindersApi.getAll(userId).then(r => r.data || []),
    () => usersApi.getUser(userId).then(r => r.data || null),
]);

// One failed request won't break the entire dashboard
console.log("Medications:", meds ?? "Failed");
console.log("Reminders:", reminders ?? "Failed");
console.log("Profile:", profile ?? "Failed");
```

## Type Imports

```typescript
// Import request types
import type { 
    UserCreate,
    LoginRequest,
    MedicationCreate,
    ReminderResponse
} from "@/types/api";

// Type-safe function
async function createMedication(
    userId: string,
    data: MedicationCreate
): Promise<void> {
    const response = await medicationsApi.create(userId, data);
    // data must match MedicationCreate structure
}
```

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=https://olive-backend-bly2.onrender.com
NEXT_PUBLIC_DEBUG_API=false
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
```

## Debug Commands

```typescript
// Check authentication
console.log(isAuthenticated()); // true/false
console.log(getCurrentUser());  // User object
console.log(getToken());        // JWT token

// Check backend connection
const health = await api.get("/health");
console.log("Backend online:", health.status === 200);

// Wake up backend (Render cold start)
import { wakeUpBackend } from "@/lib/api";
await wakeUpBackend();
```

## Common Validation

```typescript
// Reminder times must be HH:MM format
const validTimes = ["08:00", "14:00", "20:00"];
// ❌ Invalid: "8:00", "2:00 PM", "800"

// Date format is ISO (YYYY-MM-DD)
const validDate = "2026-02-22";
// ❌ Invalid: "02/22/2026", "22-02-2026"

// Drug name lookup
const generics = await drugsApi.getGenerics("Paracetamol");
// Parameter: drug name, not drug ID
```

## Timeout Configuration

```typescript
// Default 10 seconds
await usersApi.login(credentials);

// Custom timeout for specific request
await api.get("/some-endpoint", { timeoutMs: 30000 });

// File uploads: default 60 seconds
await prescriptionsApi.upload(userId, file);
```

## Security Tips

✅ **Do**:
- Store tokens in memory (automatic)
- Use HTTPS backend URL (configured)
- Validate input before sending
- Check for 401 errors (auto-handled)
- Log out on navigation away

❌ **Don't**:
- Log JWT tokens
- Store tokens in localStorage
- Log sensitive data
- Retry failed auth requests
- Trust unvalidated user input

---

**For Complete Documentation**: See `BACKEND_API_GUIDE.md`  
**For Status & Examples**: See `API_INTEGRATION_STATUS.md`  
**For Implementation Details**: See `API_IMPLEMENTATION_SUMMARY.md`
