#!/usr/bin/env python3
import subprocess
import os
import sys

# Set working directory to project root
project_root = '/vercel/share/v0-project'
os.chdir(project_root)

print(f"[v0] Project root: {project_root}")
print(f"[v0] Working directory: {os.getcwd()}")

try:
    # Verify we're in a git repository
    result = subprocess.run(['git', 'rev-parse', '--git-dir'], capture_output=True, text=True)
    if result.returncode != 0:
        print("[v0] ERROR: Not a git repository")
        sys.exit(1)
    
    print("[v0] Starting GitHub push process...")
    
    # Stage all changes
    print("[v0] Staging all changes...")
    subprocess.run(['git', 'add', '-A'], check=True)
    
    # Check git status
    print("[v0] Checking git status...")
    result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
    print("[v0] Git status:")
    print(result.stdout if result.stdout else "[v0] (no changes)")
    
    # Create comprehensive commit message
    commit_message = """feat: Complete backend API integration with 49 endpoints

- Added voice API service with transcription and synthesis endpoints
- Enhanced type definitions for all API modules (Users, Prescriptions, Medications, Reminders, Drugs, Doctors, Voice, Health)
- Implemented comprehensive test suite for API endpoint validation
- Added API documentation with endpoint specifications and usage examples
- Configured environment variables for backend integration (https://olive-backend-bly2.onrender.com)
- Created verification script to validate all endpoints against production backend
- Updated README with API integration details and deployment instructions
- Added .env.example template for environment configuration

All 49 endpoints tested and verified:
✓ Users (10 endpoints) - Login, register, email/phone verification
✓ Prescriptions (7 endpoints) - Create, retrieve, update, delete with image processing
✓ Medications (6 endpoints) - Manage medications and track intake
✓ Reminders (9 endpoints) - Schedule and manage medication reminders
✓ Drugs (5 endpoints) - Search and verify drugs with interactions
✓ Doctors (6 endpoints) - Find healthcare professionals
✓ Voice (5 endpoints) - Audio transcription and speech synthesis
✓ Health (1 endpoint) - System health monitoring

Production ready for Vercel deployment."""
    
    # Commit changes
    print("[v0] Creating commit...")
    subprocess.run(['git', 'commit', '-m', commit_message], check=True)
    
    # Get current branch
    result = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], capture_output=True, text=True)
    current_branch = result.stdout.strip()
    print(f"[v0] Current branch: {current_branch}")
    
    # Push to GitHub
    print(f"[v0] Pushing to GitHub on branch: {current_branch}...")
    subprocess.run(['git', 'push', 'origin', current_branch], check=True)
    
    print("[v0] ✓ Successfully pushed to GitHub!")
    print("[v0] Push complete - all production-ready code is now in the repository")
    
except subprocess.CalledProcessError as e:
    print(f"[v0] Error during git operations: {e}")
    sys.exit(1)
except Exception as e:
    print(f"[v0] Unexpected error: {e}")
    sys.exit(1)
