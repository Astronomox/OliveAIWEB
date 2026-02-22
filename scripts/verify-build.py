#!/usr/bin/env python3
import subprocess
import os

os.chdir('/vercel/share/v0-project')

print("[BUILD TEST] Starting Next.js build verification...")
print("=" * 60)

result = subprocess.run(
    ["npm", "run", "build"],
    capture_output=True,
    text=True
)

print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

if result.returncode == 0:
    print("=" * 60)
    print("[BUILD TEST] ✅ BUILD SUCCESSFUL - No TypeScript errors!")
    print("=" * 60)
else:
    print("=" * 60)
    print("[BUILD TEST] ❌ BUILD FAILED")
    print("=" * 60)
    exit(1)
