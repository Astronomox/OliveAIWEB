# Medi-Sync AI - Complete API Documentation

**Backend URL:** `https://olive-backend-bly2.onrender.com`

**Frontend Base:** `/vercel/share/v0-project`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users API](#users-api)
3. [Prescriptions API](#prescriptions-api)
4. [Medications API](#medications-api)
5. [Reminders API](#reminders-api)
6. [Drugs API](#drugs-api)
7. [Doctors API](#doctors-api)
8. [Voice API](#voice-api)
9. [Error Handling](#error-handling)
10. [Testing](#testing)

---

## Authentication

### JWT Token

All authenticated endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer {access_token}
```

### Token Acquisition

Tokens are obtained from:
- **Login**: `POST /api/users/login`
- **Registration**: `POST /api/users/`

### Token Refresh

Tokens expire after a certain period. The frontend API client (`lib/api.ts`) automatically handles token refresh via:
- **Endpoint**: `POST /auth/refresh`
- **Body**: `{ "refresh_token": "..." }`

---

## Users API

### Service File
Location: `services/api/users.ts`

### Endpoints

#### 1. Register User
```
POST /api/users/
```

**Request:**
```json
{
  "phone_number": "+2348012345678",
  "email": "user@example.com",
  "password": "SecurePassword@123",
  "name": "John Doe",
  "age": 35,
  "gender": "male",
  "language_preference": "en"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "phone_number": "+2348012345678",
    "email": "user@example.com",
    "name": "John Doe",
    "age": 35,
    "gender": "male",
    "language_preference": "en",
    "email_verified": false,
    "reminders_enabled": true,
    "email_reminders_enabled": true,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

#### 2. Login User
```
POST /api/users/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword@123"
}
```

**Response (200):**
```json
{
  "user": { /* UserResponse */ },
  "access_token": "...",
  "token_type": "bearer"
}
```

#### 3. Get User Profile
```
GET /api/users/{user_id}
```

**Response (200):**
```json
{
  "id": "uuid",
  "phone_number": "+2348012345678",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 35,
  "gender": "male",
  "language_preference": "en",
  "email_verified": true,
  "reminders_enabled": true,
  "email_reminders_enabled": true,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 4. Update User Profile
```
PUT /api/users/{user_id}
```

**Request:**
```json
{
  "name": "Jane Doe",
  "age": 36,
  "gender": "female",
  "language_preference": "yo"
}
```

**Response (200):** Updated UserResponse

#### 5. Delete User
```
DELETE /api/users/{user_id}
```

**Response (204):** No content

#### 6. Get User by Phone
```
GET /api/users/phone/{phone_number}
```

**Response (200):** UserResponse or 404

#### 7. Verify Phone (Send OTP)
```
POST /api/users/{user_id}/verify-phone
```

**Request (optional):**
```json
{
  "otp_code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Phone verification code sent"
}
```

#### 8. Verify Email (Send Verification)
```
POST /api/users/{user_id}/verify-email
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

#### 9. Confirm Email
```
POST /api/users/{user_id}/confirm-email?otp_code={code}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 10. Logout
```
POST /api/users/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Prescriptions API

### Service File
Location: `services/api/prescriptions.ts`

### Endpoints

#### 1. Create Prescription
```
POST /api/prescriptions/{user_id}
```

**Request:**
```json
{
  "image_url": "https://...",
  "ocr_text": "Amoxicillin 500mg - Take 1 tablet 3 times daily for 7 days"
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "image_url": "https://...",
  "ocr_text": "Amoxicillin 500mg...",
  "ocr_confidence": 0.95,
  "status": "pending",
  "verified_by_user": false,
  "created_at": "2024-01-15T10:30:00Z",
  "drugs": [
    {
      "drug_name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "7 days"
    }
  ]
}
```

#### 2. Upload Prescription Image with OCR
```
POST /api/prescriptions/{user_id}/upload
```

**Request:** FormData
- `file`: Image file (jpg, png, pdf)
- `auto_match`: boolean (optional, default: true)

**Response (201):**
```json
{
  "text": "Extracted OCR text from image",
  "confidence": 0.92,
  "drugs": [
    {
      "drug_name": "Amoxicillin",
      "dosage": "500mg",
      "frequency": "3 times daily"
    }
  ]
}
```

#### 3. Get All User Prescriptions
```
GET /api/prescriptions/{user_id}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": "uuid",
    "image_url": "...",
    "ocr_text": "...",
    "status": "verified",
    "verified_by_user": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### 4. Get Single Prescription
```
GET /api/prescriptions/{prescription_id}
```

**Response (200):** PrescriptionResponse

#### 5. Update Prescription
```
PUT /api/prescriptions/{prescription_id}
```

**Request:**
```json
{
  "status": "verified",
  "verified_by_user": true
}
```

**Response (200):** Updated PrescriptionResponse

#### 6. Delete Prescription
```
DELETE /api/prescriptions/{prescription_id}
```

**Response (204):** No content

#### 7. Add Drug to Prescription
```
POST /api/prescriptions/{prescription_id}/drugs
```

**Request:**
```json
{
  "drug_name": "Ibuprofen",
  "dosage": "400mg",
  "frequency": "2 times daily",
  "duration": "5 days"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Drug added to prescription"
}
```

---

## Medications API

### Service File
Location: `services/api/medications.ts`

### Endpoints

#### 1. Create Medication
```
POST /api/medications/{user_id}
```

**Request:**
```json
{
  "prescription_id": 1,
  "drug_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "start_date": "2024-01-15",
  "end_date": "2024-01-22",
  "reminder_times": ["09:00", "13:00", "17:00"],
  "side_effects": ["nausea", "headache"]
}
```

**Response (201):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "prescription_id": 1,
  "drug_name": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "3 times daily",
  "start_date": "2024-01-15",
  "end_date": "2024-01-22",
  "reminder_times": "09:00,13:00,17:00",
  "reminders_sent": 0,
  "status": "active",
  "side_effects": "nausea,headache",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Get All Medications
```
GET /api/medications/user/{user_id}?status=active
```

**Query Parameters:**
- `status`: "active" | "inactive" | "completed" (optional)

**Response (200):** MedicationResponse[]

#### 3. Get Single Medication
```
GET /api/medications/{medication_id}
```

**Response (200):** MedicationResponse

#### 4. Update Medication
```
PUT /api/medications/{medication_id}
```

**Request:**
```json
{
  "dosage": "1000mg",
  "reminder_times": ["08:00", "16:00"],
  "end_date": "2024-01-25"
}
```

**Response (200):** Updated MedicationResponse

#### 5. Delete Medication
```
DELETE /api/medications/{medication_id}
```

**Response (204):** No content

#### 6. Record Compliance
```
POST /api/medications/{medication_id}/compliance
```

**Response (200):**
```json
{
  "id": 1,
  "user_id": "uuid",
  "drug_name": "Amoxicillin",
  "status": "active",
  "reminders_sent": 1
}
```

#### 7. Add Side Effect
```
POST /api/medications/{medication_id}/side-effect?effect={effect_name}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Side effect recorded"
}
```

---

## Reminders API

### Service File
Location: `services/api/reminders.ts`

### Endpoints

#### 1. Create Reminders
```
POST /api/medications/{medication_id}/reminders
```

**Request:** Array of time strings
```json
["08:00", "14:00", "20:00"]
```

**Response (201):** ReminderResponse[]

#### 2. Get All User Reminders
```
GET /api/reminders/user/{user_id}?status=pending&days=7
```

**Query Parameters:**
- `status`: "pending" | "sent" | "taken" (optional)
- `days`: number (optional, filter last N days)

**Response (200):**
```json
[
  {
    "id": 1,
    "user_id": "uuid",
    "medication_id": 1,
    "reminder_datetime": "2024-01-15T09:00:00Z",
    "sent": true,
    "delivery_status": "whatsapp_sent",
    "whatsapp_message_id": "wamid...",
    "created_at": "2024-01-15T08:00:00Z",
    "drug_name": "Amoxicillin",
    "dosage": "500mg"
  }
]
```

#### 3. Get Reminder Stats
```
GET /api/reminders/user/{user_id}/stats
```

**Response (200):**
```json
{
  "total": 30,
  "sent": 25,
  "taken": 20,
  "pending": 5
}
```

#### 4. Get Single Reminder
```
GET /api/reminders/{reminder_id}
```

**Response (200):** ReminderResponse

#### 5. Update Reminder
```
PUT /api/reminders/{reminder_id}
```

**Request:**
```json
{
  "delivery_status": "delivered",
  "sent": true
}
```

**Response (200):** Updated ReminderResponse

#### 6. Delete Reminder
```
DELETE /api/reminders/{reminder_id}
```

**Response (204):** No content

#### 7. Snooze Reminder
```
POST /api/reminders/{reminder_id}/snooze?minutes=10
```

**Query Parameters:**
- `minutes`: number (default: 10)

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder snoozed for 10 minutes"
}
```

#### 8. Mark Reminder as Taken
```
POST /api/reminders/{reminder_id}/taken
```

**Response (200):**
```json
{
  "success": true,
  "message": "Reminder marked as taken"
}
```

#### 9. Send All Pending Reminders
```
POST /api/reminders/pending/send-all
```

**Response (200):**
```json
{
  "sent": 15,
  "failed": 2,
  "errors": [
    {
      "reminder_id": 5,
      "error": "Invalid phone number"
    }
  ]
}
```

---

## Drugs API

### Service File
Location: `services/api/drugs.ts`

### Endpoints

#### 1. Search Drugs
```
GET /api/drugs/search?q=aspirin
```

**Query Parameters:**
- `q`: string (search query)

**Response (200):**
```json
{
  "results": [
    {
      "emdex_id": "ASPIRIN001",
      "name": "Aspirin",
      "generic_name": "Acetylsalicylic Acid",
      "price_naira": 150,
      "manufacturer": "Pharma Inc",
      "generics": [
        {
          "name": "Generic Aspirin",
          "price_naira": 100,
          "manufacturer": "Generic Pharma",
          "savings": 50
        }
      ]
    }
  ]
}
```

#### 2. Get Drug by Emdex ID
```
GET /api/drugs/{emdex_id}
```

**Response (200):** DrugResponse

#### 3. Get Generic Alternatives
```
GET /api/drugs/{drug_name}/generics
```

**Response (200):** GenericResponse[]

#### 4. Compare Drug Prices
```
GET /api/drugs/prices/compare?drug_name=aspirin
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "drug_name": "Aspirin",
    "prices": [
      {
        "manufacturer": "Pharma Inc",
        "price_naira": 150,
        "quantity": 10
      }
    ]
  }
}
```

#### 5. Verify Drug Registration
```
POST /api/drugs/verify
```

**Request:**
```json
{
  "reg_number": "NAFDAC/A4L/0001"
}
```

**Response (200):**
```json
{
  "status": "verified",
  "message": "Drug is registered and approved",
  "product_details": {
    "name": "Aspirin",
    "registration_date": "2020-01-15",
    "expiry_date": "2025-01-15"
  },
  "verification_tips": [
    "Check expiry date",
    "Verify packaging"
  ]
}
```

#### 6. Sync Emdex Database
```
POST /api/drugs/sync-emdex?force=false
```

**Query Parameters:**
- `force`: boolean (force resync)

**Response (200):**
```json
{
  "success": true,
  "message": "Emdex database synced",
  "data": {
    "synced": 5000,
    "updated": 200
  }
}
```

---

## Doctors API

### Service File
Location: `services/api/doctors.ts`

### Endpoints

#### 1. Get All Doctors
```
GET /api/doctors?limit=20&offset=0&specialization=cardiologist
```

**Query Parameters:**
- `specialization`: string (optional)
- `location`: string (optional)
- `availability_status`: "available" | "busy" | "offline" (optional)
- `limit`: number (default: 20)
- `offset`: number (default: 0)

**Response (200):**
```json
{
  "results": [
    {
      "id": "doc-uuid-1",
      "name": "Dr. Smith",
      "specialization": "Cardiologist",
      "license_number": "LIC/2020/001",
      "phone_number": "+2347000000001",
      "email": "doctor@example.com",
      "hospital": "Teaching Hospital",
      "location": "Lagos",
      "years_of_experience": 10,
      "consultation_fee": 5000,
      "availability_status": "available",
      "rating": 4.8,
      "profile_image": "https://...",
      "bio": "Expert in cardiac care",
      "languages": ["English", "Yoruba"],
      "created_at": "2020-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

#### 2. Search Doctors
```
GET /api/doctors/search?q=cardiologist
```

**Query Parameters:**
- `q`: string (search by name or specialization)

**Response (200):** DoctorSearchResponse

#### 3. Get Doctor Details
```
GET /api/doctors/{doctor_id}
```

**Response (200):** DoctorResponse

#### 4. Get Doctor Specializations
```
GET /api/doctors/specializations
```

**Response (200):**
```json
[
  "Cardiologist",
  "Pediatrician",
  "Neurologist",
  "General Practitioner"
]
```

#### 5. Request Consultation
```
POST /api/doctors/{doctor_id}/consult
```

**Request:**
```json
{
  "message": "I have been experiencing chest pain for 3 days",
  "urgency_level": "high"
}
```

**Response (201):**
```json
{
  "id": "consult-uuid",
  "user_id": "user-uuid",
  "doctor_id": "doc-uuid",
  "message": "I have been experiencing chest pain...",
  "urgency_level": "high",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "doctor": {
    "id": "doc-uuid",
    "name": "Dr. Smith",
    "specialization": "Cardiologist"
  }
}
```

#### 6. Get User Consultations
```
GET /api/consultations/user/{user_id}
```

**Response (200):** ConsultationResponse[]

---

## Voice API

### Service File
Location: `services/api/voice.ts`

### Endpoints

#### 1. Transcribe Audio
```
POST /api/voice/transcribe
```

**Request:** FormData
- `audio_file`: Audio file (mp3, wav, ogg, webm, etc.)
- `language`: string (optional, e.g., "en", "yo", "ig")

**Response (200):**
```json
{
  "text": "Take one tablet three times daily",
  "confidence": 0.95,
  "language": "en",
  "duration_seconds": 3.5
}
```

#### 2. Text to Speech
```
POST /api/voice/synthesize
```

**Request:**
```json
{
  "text": "Take your medication now",
  "language": "en",
  "speed": "normal",
  "gender": "female"
}
```

**Response (200):**
```json
{
  "audio_url": "https://...",
  "format": "mp3",
  "duration_seconds": 2.1
}
```

**Query Parameters:**
- `format`: "mp3" | "wav" | "ogg" (optional)

#### 3. Transcribe and Process
```
POST /api/voice/transcribe-and-process
```

**Request:** FormData
- `audio_file`: Audio file
- `language`: string (optional)

**Response (200):**
```json
{
  "text": "I took amoxicillin and aspirin this morning",
  "confidence": 0.92,
  "medications_detected": [
    {
      "drug_name": "Amoxicillin",
      "action": "took",
      "time": "morning"
    }
  ]
}
```

#### 4. Get Supported Languages
```
GET /api/voice/supported-languages
```

**Response (200):**
```json
[
  "en",
  "yo",
  "ig",
  "ha",
  "fr"
]
```

#### 5. Test Voice Service
```
POST /api/voice/test
```

**Response (200):**
```json
{
  "success": true,
  "message": "Voice service is operational",
  "capabilities": {
    "transcription": true,
    "synthesis": true
  }
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "status": 400
}
```

### Common Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Deletion successful |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error (see `detail` for specifics) |
| 500 | Server Error | Backend error |

### Error Handling in Frontend

The API client in `lib/api.ts` automatically handles errors:

```typescript
const { data, error, status } = await usersApi.login(credentials);

if (error) {
  console.error('Login failed:', error.message);
  // Handle error
} else {
  console.log('User logged in:', data.user);
}
```

---

## Testing

### Test Suite

Run the API integration tests:

```bash
# Run tests (requires test runner)
npm test -- __tests__/api-integration.test.ts
```

### Verification Script

Verify all endpoints are working:

```bash
# Run endpoint verification
npx ts-node scripts/verify-api-endpoints.ts
```

### Manual Testing

Use tools like Postman or cURL:

```bash
# Example: Get user profile
curl -H "Authorization: Bearer {token}" \
  https://olive-backend-bly2.onrender.com/api/users/{user_id}
```

---

## Frontend Integration

All services are available from `services/api/`:

```typescript
import {
  usersApi,
  prescriptionsApi,
  medicationsApi,
  remindersApi,
  drugsApi,
  doctorsApi,
  voiceApi,
  healthApi,
} from "@/services/api";

// Example: Create medication
const { data, error } = await medicationsApi.create(userId, {
  drug_name: "Amoxicillin",
  dosage: "500mg",
  frequency: "3 times daily",
  start_date: "2024-01-15",
  reminder_times: ["09:00", "13:00", "17:00"],
});

if (error) {
  console.error("Error:", error.message);
} else {
  console.log("Medication created:", data);
}
```

---

## Environment Configuration

Backend URL is configured in `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=https://olive-backend-bly2.onrender.com
NEXT_PUBLIC_API_URL=https://olive-backend-bly2.onrender.com
NEXT_PUBLIC_DEBUG_API=false
```

---

## Support

For issues or questions:
1. Check the test suite: `__tests__/api-integration.test.ts`
2. Run verification script: `scripts/verify-api-endpoints.ts`
3. Review error messages and status codes
4. Check backend logs at the hosting provider

---

**Last Updated:** January 2024  
**API Version:** 1.0.0  
**Frontend Framework:** Next.js 14  
**Backend Framework:** FastAPI  
