# Backend API Integration Guide - Medi-Sync AI

Complete implementation guide for integrating the Medi-Sync AI backend API into your Next.js frontend.

## Quick Start

### 1. Environment Setup

Create or update `.env.local`:

```bash
# Backend URL Configuration
NEXT_PUBLIC_BACKEND_URL=https://olive-backend-bly2.onrender.com
NEXT_PUBLIC_API_URL=https://olive-backend-bly2.onrender.com

# Optional: Enable debug logging
NEXT_PUBLIC_DEBUG_API=false

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
```

### 2. Import & Use API Services

```typescript
import { usersApi, medicationsApi, remindersApi, voiceApi } from "@/services/api";

// User login
const response = await usersApi.login({
    email: "user@example.com",
    password: "password123"
});

if (response.data) {
    console.log("Login successful!");
} else {
    console.error("Login failed:", response.error?.message);
}
```

## API Services Overview

### Core Services

| Service | Functions | File |
|---------|-----------|------|
| **Users** | Login, Register, Profile, Verification | `services/api/users.ts` |
| **Prescriptions** | Upload, Create, Update, Delete | `services/api/prescriptions.ts` |
| **Medications** | CRUD, Compliance Tracking | `services/api/medications.ts` |
| **Reminders** | Schedule, Update Status, Snooze | `services/api/reminders.ts` |
| **Drugs** | Search, Generics, Verification | `services/api/drugs.ts` |
| **Doctors** | Search, Filter, Consultations | `services/api/doctors.ts` |
| **Voice** | Transcribe, Synthesize, Languages | `services/api/voice.ts` |

## Detailed Service Documentation

### Users API (`usersApi`)

Authentication and user management.

```typescript
import { usersApi } from "@/services/api";

// Register new user
await usersApi.register({
    phone_number: "+234801234567",
    email: "user@example.com",
    name: "John Doe",
    password: "secure_password",
    age: 30,
    gender: "M",
    language_preference: "en"
});

// Login
const login = await usersApi.login({
    email: "user@example.com",
    password: "secure_password"
});

// Get user profile
await usersApi.getUser("user-id");

// Update profile
await usersApi.updateUser("user-id", {
    name: "Jane Doe",
    age: 31
});

// Verify phone (send OTP)
await usersApi.verifyPhone("user-id");

// Verify email (send verification)
await usersApi.verifyEmail("user-id");

// Confirm email with OTP
await usersApi.confirmEmail("user-id", "123456");

// Logout
await usersApi.logout();
```

### Prescriptions API (`prescriptionsApi`)

Prescription management with OCR support.

```typescript
import { prescriptionsApi } from "@/services/api";

// Upload prescription image with OCR
const file = /* File from input */;
const ocr = await prescriptionsApi.upload("user-id", file, true);
// Returns: { text, confidence, drugs }

// Create prescription
await prescriptionsApi.create("user-id", {
    image_url: "https://...",
    ocr_text: "Extracted prescription text",
    drugs: [
        { drug_name: "Paracetamol", dosage: "500mg" }
    ]
});

// Get all prescriptions
const list = await prescriptionsApi.getAll("user-id");

// Get single prescription
await prescriptionsApi.get(prescription_id);

// Update prescription status
await prescriptionsApi.update(prescription_id, {
    status: "verified",
    verified_by_user: true
});

// Add drug to prescription
await prescriptionsApi.addDrug(prescription_id, {
    drug_name: "Ibuprofen",
    dosage: "400mg",
    frequency: "Every 6 hours"
});

// Delete prescription
await prescriptionsApi.delete(prescription_id);
```

### Medications API (`medicationsApi`)

Create and manage medications with reminders.

```typescript
import { medicationsApi } from "@/services/api";

// Create medication
await medicationsApi.create("user-id", {
    drug_name: "Paracetamol",
    dosage: "500mg",
    frequency: "Every 4-6 hours",
    start_date: "2026-02-22",
    end_date: "2026-03-22",
    reminder_times: ["08:00", "14:00", "20:00"],
    side_effects: ["nausea"]
});

// Get all medications (with optional status filter)
const meds = await medicationsApi.getAll("user-id", "active");

// Get single medication
await medicationsApi.get(medication_id);

// Update medication
await medicationsApi.update(medication_id, {
    dosage: "1000mg",
    end_date: "2026-04-22"
});

// Record medication compliance (user took it)
await medicationsApi.recordCompliance(medication_id);

// Add side effect
await medicationsApi.addSideEffect(medication_id, "headache");

// Delete medication
await medicationsApi.delete(medication_id);
```

### Reminders API (`remindersApi`)

Schedule and manage medication reminders.

```typescript
import { remindersApi } from "@/services/api";

// Create reminder for medication
await remindersApi.create(medication_id, ["08:00", "20:00"]);

// Get all reminders (with filters)
const reminders = await remindersApi.getAll(
    "user-id",
    "pending",  // status: pending, sent, missed
    7          // days: fetch for next 7 days
);

// Get reminder statistics
const stats = await remindersApi.getStats("user-id");
// Returns: { total, sent, taken, pending }

// Get single reminder
await remindersApi.get(reminder_id);

// Update reminder (e.g., delivery status)
await remindersApi.update(reminder_id, {
    delivery_status: "delivered",
    sent: true
});

// Mark reminder as taken
await remindersApi.markTaken(reminder_id);

// Snooze reminder
await remindersApi.snooze(reminder_id, 10); // 10 minutes default

// Send all pending reminders
const result = await remindersApi.sendAllPending();
// Returns: { sent, failed, errors }

// Delete reminder
await remindersApi.delete(reminder_id);
```

### Drugs API (`drugsApi`)

Search and verify medications.

```typescript
import { drugsApi } from "@/services/api";

// Search drugs
const results = await drugsApi.search("paracetamol");
// Returns: { results: [{ emdex_id, name, price_naira, ... }] }

// Get drug details
await drugsApi.get("emdex-id-12345");

// Get generic alternatives
const generics = await drugsApi.getGenerics("Paracetamol");
// Returns: [{ name, price_naira, savings }]

// Compare prices for a drug
await drugsApi.comparePrices("Paracetamol");

// Verify NAFDAC registration
const verified = await drugsApi.verify({
    reg_number: "A4-0123"
});
// Returns: { status, message, product_details, verification_tips }

// Sync Emdex database (admin only)
await drugsApi.syncEmdex(false); // force: false for incremental sync
```

### Doctors API (`doctorsApi`)

Find and consult with doctors.

```typescript
import { doctorsApi } from "@/services/api";

// Get all doctors with filters
const doctors = await doctorsApi.getAll({
    specialization: "Cardiology",
    location: "Lagos",
    availability_status: "available",
    limit: 20,
    offset: 0
});

// Search doctors
const search = await doctorsApi.search("cardiologist");

// Get doctor details
await doctorsApi.get("doctor-id");

// Get available specializations
const specs = await doctorsApi.getSpecializations();

// Request consultation
await doctorsApi.requestConsultation("doctor-id", {
    message: "I have chest pain",
    urgency_level: "high"
});

// Get consultation history
const consultations = await doctorsApi.getConsultations("user-id");
```

### Voice API (`voiceApi`)

Speech recognition and text-to-speech.

```typescript
import { voiceApi } from "@/services/api";

// Transcribe audio file
const audioFile = /* File from <input type="file" accept="audio/*"> */;
const transcript = await voiceApi.transcribe(audioFile, "en");
// Returns: { text, confidence, language, duration_seconds }

// Text-to-speech
const speech = await voiceApi.synthesize("Please take your medication", {
    language: "en",
    speed: "normal",
    gender: "female",
    format: "mp3"
});
// Returns: { audio_url, audio_data?, format, duration_seconds }

// Transcribe and extract medication info
const processed = await voiceApi.transcribeAndProcess(audioFile, "en");

// Get supported languages
const languages = await voiceApi.getSupportedLanguages();

// Test voice service health
await voiceApi.testVoiceService();
```

#### Browser Web Speech API (fallback)

```typescript
import { 
    createSpeechRecognition, 
    speakText, 
    isSpeechRecognitionSupported 
} from "@/services/voice";

// Check browser support
if (isSpeechRecognitionSupported()) {
    const recognition = createSpeechRecognition({
        language: "en",
        onResult: (transcript, isFinal) => {
            console.log(transcript);
            if (isFinal) console.log("Done:", transcript);
        },
        onStateChange: (state) => {
            console.log("State:", state); // listening, idle, error
        },
        onError: (error) => {
            console.error(error);
        }
    });
    
    recognition?.start();
}

// Text-to-speech
const speaker = speakText("Hello, how are you?", {
    language: "en",
    speed: "normal",
    onStart: () => console.log("Speaking..."),
    onEnd: () => console.log("Done speaking")
});

// Cancel speech
speaker.cancel();
```

## Error Handling

### Response Structure

All API calls return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
    data: T | null;           // The response data (null on error)
    status: number;            // HTTP status code
    error: {                   // Error info (null on success)
        message: string;
        code?: string;
        detail?: unknown;      // Detailed error for 422
    } | null;
}
```

### Handling Different Errors

```typescript
const response = await medicationsApi.create(userId, data);

if (!response.error) {
    // Success
    console.log("Created:", response.data);
    return;
}

// Handle specific error codes
switch (response.status) {
    case 422:
        // Validation error
        console.error("Validation failed:", response.error.detail);
        break;
    case 401:
        // Unauthorized — auto-redirected by API client
        console.error("Session expired");
        break;
    case 404:
        // Not found
        console.error("Resource not found");
        break;
    case 500:
        // Server error
        console.error("Server error:", response.error.message);
        break;
    default:
        // Network or other error
        console.error("Request failed:", response.error.message);
}
```

## Advanced Usage

### Using with React Hooks

```typescript
import { useEffect, useState } from "react";
import { medicationsApi } from "@/services/api";
import { getUserId } from "@/lib/auth";

export function MedicationList() {
    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = getUserId();

    useEffect(() => {
        async function fetch() {
            const response = await medicationsApi.getAll(userId!);
            if (response.data) {
                setMedications(response.data);
            }
            setLoading(false);
        }
        fetch();
    }, [userId]);

    if (loading) return <div>Loading...</div>;
    return (
        <ul>
            {medications.map(med => (
                <li key={med.id}>{med.drug_name}</li>
            ))}
        </ul>
    );
}
```

### Using with SWR for Caching

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
            return response.data;
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

### Parallel Requests with Safe Fallback

```typescript
import { safeParallelFetch } from "@/lib/api";
import { 
    medicationsApi, 
    remindersApi, 
    usersApi 
} from "@/services/api";

async function loadDashboard(userId: string) {
    const [medications, reminders, profile] = await safeParallelFetch([
        () => medicationsApi.getAll(userId).then(r => r.data || []),
        () => remindersApi.getAll(userId).then(r => r.data || []),
        () => usersApi.getUser(userId).then(r => r.data || null),
    ]);

    // One failed request won't break the whole dashboard
    console.log("Medications:", medications ?? "Failed");
    console.log("Reminders:", reminders ?? "Failed");
    console.log("Profile:", profile ?? "Failed");
}
```

## Authentication Flow

### Login & Token Management

```typescript
import { usersApi } from "@/services/api";
import { getToken, isAuthenticated, getCurrentUser } from "@/lib/auth";

// Login
const loginResponse = await usersApi.login({
    email: "user@example.com",
    password: "password"
});

if (loginResponse.data) {
    // Token automatically stored in memory
    console.log("Logged in as:", loginResponse.data.user.name);
}

// Check if authenticated
if (isAuthenticated()) {
    console.log("User is logged in");
    console.log("Token:", getToken());
    console.log("User:", getCurrentUser());
}

// Logout
await usersApi.logout();
```

### Automatic Token Refresh

The API client automatically:
1. Detects 401 responses
2. Attempts token refresh
3. Retries the original request once
4. Redirects to `/login` if refresh fails

No additional code needed!

## Testing

### Health Check

```typescript
import { api } from "@/lib/api";

const health = await api.get("/health");
if (health.status === 200) {
    console.log("Backend is online");
}
```

### Wake Up Backend (Cold Start)

```typescript
import { wakeUpBackend } from "@/lib/api";

// Call on app startup
await wakeUpBackend();
```

### Debug API Calls

```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG_API=true
```

Then check browser console for detailed logs.

## Troubleshooting

### "Cannot find module @/services/api"

Make sure all services are exported in `services/api/index.ts`:

```typescript
export { usersApi } from "./users";
export { prescriptionsApi } from "./prescriptions";
export { medicationsApi } from "./medications";
export { remindersApi } from "./reminders";
export { drugsApi } from "./drugs";
export { doctorsApi } from "./doctors";
export { voiceApi } from "./voice";
```

### 422 Validation Errors

Backend returned validation errors. Check `response.error.detail` for field-specific issues:

```typescript
if (response.status === 422) {
    console.log("Validation errors:", response.error.detail);
    // Typically an array of error objects with field and message
}
```

### CORS Errors

Backend CORS not configured properly. Check backend logs:

```bash
curl -H "Origin: http://localhost:3000" \
     -v https://olive-backend-bly2.onrender.com/health
```

### Timeout Errors

Backend taking too long. For Render.com free tier:

1. Call `wakeUpBackend()` at app startup
2. Increase timeout: `api.get(path, { timeoutMs: 30000 })`

### Network Errors (status 0)

No internet connection or CORS blocked. Check:
- Browser console for network tab
- Backend URL in `.env.local`
- CORS configuration on backend

## Best Practices

1. **Always check error responses**
   ```typescript
   if (response.error) {
       // Handle error
   } else {
       // Use response.data
   }
   ```

2. **Use proper TypeScript types**
   ```typescript
   import type { MedicationResponse } from "@/types/api";
   ```

3. **Cache responses when appropriate**
   ```typescript
   // Use SWR for frequently accessed data
   const { data: medications } = useSWR(
       `/medications/${userId}`,
       fetcher
   );
   ```

4. **Handle 401 gracefully**
   ```typescript
   // API client auto-handles, but you can add listeners
   if (response.status === 401) {
       // Show login prompt
   }
   ```

5. **Validate inputs before sending**
   ```typescript
   if (!email || !password) {
       return; // Don't call API
   }
   ```

6. **Use FormData for file uploads**
   ```typescript
   const formData = new FormData();
   formData.append("file", fileInput.files[0]);
   // API client auto-handles
   ```

## Performance Tips

1. Use `safeParallelFetch()` for multiple requests
2. Implement request debouncing for search endpoints
3. Cache medication lists with SWR
4. Lazy-load doctor lists with pagination
5. Use `request.abort()` for outdated requests

## Security Considerations

1. ✅ JWT tokens stored in memory (protected from XSS)
2. ✅ Tokens never logged or exposed
3. ✅ HTTPS enforced (backend URL)
4. ✅ CORS handled by API client
5. ✅ Sensitive data only in secure cookies (if configured)

---

**For Complete Endpoint Reference**: See `API_INTEGRATION_STATUS.md`

**Backend Repository**: TBD (provide link to backend repo)

**Questions?**: Check backend logs at `https://olive-backend-bly2.onrender.com`
