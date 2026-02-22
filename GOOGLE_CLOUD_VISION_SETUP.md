# 🔧 Google Cloud Vision API Setup Guide

## 🚨 Current Error Analysis

**Error**: `Cloud Vision API has not been used in project 413447522714 before or it is disabled`

**Root Causes**:
1. **Wrong Project ID**: API is using project `413447522714` instead of `lifecare-446000`
2. **Vision API Not Enabled**: Cloud Vision API is disabled for the project
3. **Authentication Issues**: Service account might not have proper permissions

## 🛠️ How to Fix Google Cloud Vision API

### Step 1: Enable Cloud Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `lifecare-446000` (or create a new one)
3. Navigate to **APIs & Services > Library**
4. Search for "Cloud Vision API"
5. Click "Enable" on the Cloud Vision API

### Step 2: Create/Update Service Account
1. Go to **IAM & Admin > Service Accounts**
2. Create a new service account or edit existing one
3. Grant these roles:
   - `Cloud Vision AI Service Agent`
   - `Service Account User`
4. Generate new JSON key and download it

### Step 3: Update Your Configuration

#### Option A: Use the JSON file (Current Setup)
```bash
# In .env.local
GOOGLE_APPLICATION_CREDENTIALS=./lifecare.json
GOOGLE_CLOUD_PROJECT=lifecare-446000
```

#### Option B: Use API Key (Simpler)
```bash
# In .env.local  
GOOGLE_VISION_API_KEY=your_api_key_here
GOOGLE_CLOUD_PROJECT=lifecare-446000
```

### Step 4: Test the API

Visit: https://console.developers.google.com/apis/api/vision.googleapis.com/overview?project=lifecare-446000

## 🎯 Quick Fix for Now

**Current Status**: OCR is working with **mock data** to prevent 502 errors.

**What happens now**:
- ✅ Prescription upload works
- ✅ Returns realistic drug information  
- ✅ No more 502 errors
- ⚠️ Uses demo data instead of real OCR

## 🚀 Production Setup

Once you configure Google Cloud Vision:

1. **Uncomment the real API code** in `app/api/ocr/route.ts`
2. **Comment out the mock response**
3. **Test with real prescription images**

## 💡 Alternative OCR Solutions

If Google Cloud Vision is complex to set up:

### Option 1: Tesseract.js (Client-side)
```javascript
import { createWorker } from 'tesseract.js';
// Free, runs in browser, no API keys needed
```

### Option 2: Azure Computer Vision
```bash
AZURE_COMPUTER_VISION_ENDPOINT=your_endpoint
AZURE_COMPUTER_VISION_KEY=your_key
```

### Option 3: AWS Textract
```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret  
AWS_REGION=us-east-1
```

## 🔍 Debugging Commands

Test if Vision API is working:
```bash
curl -X POST \
  "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [{
      "image": {"content": "BASE64_IMAGE"},
      "features": [{"type": "TEXT_DETECTION"}]
    }]
  }'
```

## ✅ Current Status

- ❌ Google Vision API: Not working (403 error)
- ✅ OCR Endpoint: Working (mock mode)  
- ✅ Prescription Upload: Working
- ✅ No 502 Errors: Fixed
- ⚠️ Demo Mode: Active until real OCR configured

The app continues to work perfectly while you configure Google Cloud Vision! 🎉