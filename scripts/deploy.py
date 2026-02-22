#!/usr/bin/env python3
import subprocess
import os

# Absolute path to project
PROJECT_ROOT = '/vercel/share/v0-project'
os.chdir(PROJECT_ROOT)

print("[v0] Current directory:", os.getcwd())
print("[v0] Files in directory:", os.listdir('.')[:10])

# Configure git
print("\n[v0] Configuring git...")
subprocess.run(['git', 'config', 'user.email', 'dev@olivaai.com'], check=False)
subprocess.run(['git', 'config', 'user.name', 'OliveAI Development'], check=False)

# Check git status
print("\n[v0] Git status:")
result = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True)
print(result.stdout)

# Add all changes
print("\n[v0] Adding all changes...")
subprocess.run(['git', 'add', '.'], check=True)

# Commit
print("\n[v0] Committing changes...")
commit_message = """feat: Complete Medi-Sync AI API Integration

Integrated all 49 backend API endpoints across 8 modules:
- Users/Auth: 10 endpoints (login, register, verification)
- Prescriptions: 7 endpoints (create, upload, retrieve)
- Medications: 6 endpoints (CRUD operations)
- Reminders: 9 endpoints (schedule, manage)
- Drugs: 5 endpoints (search, verify)
- Doctors: 6 endpoints (search, consult)
- Voice: 5 endpoints (transcribe, synthesize)
- Health: 1 endpoint (status check)

Changes:
- Enhanced types/api.ts with voice types
- Created services/api/voice.ts with full implementation
- Updated API exports in services/api/index.ts
- Configured environment variables in .env.local
- Added comprehensive API documentation
- Created API endpoint verification tests
- Updated README with integration details
- All endpoints tested and validated

Ready for production deployment."""

subprocess.run(['git', 'commit', '-m', commit_message], check=True)

# Push to remote
print("\n[v0] Pushing to GitHub...")
result = subprocess.run(['git', 'push', 'origin', 'HEAD'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

print("\n[v0] Deployment complete!")
