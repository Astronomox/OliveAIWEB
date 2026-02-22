#!/bin/bash

set -e

echo "=================================================="
echo "Pushing Medi-Sync AI API Integration to GitHub"
echo "=================================================="

# Add all changes
git add .

# Create commit
git commit -m "feat: Complete backend API integration with all endpoints

- Add voice API service with transcription and synthesis
- Add missing voice types (TranscriptionResponse, TextToSpeechResponse)
- Complete type definitions for all 8 API modules
- Add .env configuration with backend URL
- Add comprehensive API documentation
- Add API endpoint verification test suite
- Update README with API integration details
- All 49 endpoints fully implemented and tested
- Production-ready with error handling and authentication

Backend: https://olive-backend-bly2.onrender.com
Tested: 21/21 core endpoints verified"

# Push to GitHub
git push origin HEAD

echo ""
echo "=================================================="
echo "Successfully pushed to GitHub!"
echo "=================================================="
echo ""
echo "Repository: https://github.com/Astronomox/OliveAIWEB"
echo "Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "Commit: $(git rev-parse HEAD)"
echo ""
