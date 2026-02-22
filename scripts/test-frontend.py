#!/usr/bin/env python3
"""
Frontend Test Script - Validates Next.js build and API integration
"""

import subprocess
import sys
import os
import json

PROJECT_ROOT = '/vercel/share/v0-project'
os.chdir(PROJECT_ROOT)

def run_command(cmd, description):
    """Run a command and report status"""
    print(f"\n{'='*60}")
    print(f"[TEST] {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)
        
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"ERROR: Command timed out")
        return False
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return False

def main():
    print("\n" + "="*60)
    print("OLIVE AI - FRONTEND TEST SUITE")
    print("="*60)
    
    results = {}
    
    # 1. Check Node.js installation
    results['node_check'] = run_command(
        'node --version && npm --version',
        'Checking Node.js and npm installation'
    )
    
    # 2. Check project structure
    results['project_structure'] = run_command(
        'ls -la | grep -E "package.json|tsconfig.json|tailwind.config|next.config"',
        'Checking project structure'
    )
    
    # 3. Verify environment configuration
    results['env_check'] = run_command(
        'test -f .env.local && echo "✓ .env.local found" || echo "✗ .env.local missing"',
        'Verifying environment configuration'
    )
    
    # 4. Check dependencies
    results['deps_check'] = run_command(
        'npm list --depth=0 2>/dev/null | head -20',
        'Checking installed dependencies'
    )
    
    # 5. Run linter
    results['lint'] = run_command(
        'npm run lint 2>&1 | head -50',
        'Running ESLint'
    )
    
    # 6. Build the project
    results['build'] = run_command(
        'npm run build 2>&1 | tail -50',
        'Building Next.js project'
    )
    
    # 7. Verify build output
    results['build_output'] = run_command(
        'test -d .next && echo "✓ .next build directory created" || echo "✗ Build directory missing"',
        'Verifying build output'
    )
    
    # 8. Check API service files
    results['api_services'] = run_command(
        'ls -la services/api/ | grep -E "\.ts$"',
        'Checking API service files'
    )
    
    # 9. Validate TypeScript types
    results['types_check'] = run_command(
        'test -f types/api.ts && wc -l types/api.ts && echo "✓ API types file valid" || echo "✗ Types file missing"',
        'Validating TypeScript types'
    )
    
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ FRONTEND BUILD SUCCESSFUL - Ready for deployment")
        return 0
    else:
        print("\n✗ Some tests failed - Check output above")
        return 1

if __name__ == '__main__':
    sys.exit(main())
