import os
import subprocess

print(f"Current working directory: {os.getcwd()}")
print(f"Script location: {os.path.abspath(__file__)}")
print(f"\nDirectory contents:")
for item in os.listdir('.'):
    print(f"  {item}")

print(f"\nListing parent directories...")
try:
    parent = os.path.dirname(os.getcwd())
    print(f"Parent dir: {parent}")
    if os.path.exists(parent):
        print(f"Contents of {parent}:")
        for item in os.listdir(parent):
            print(f"  {item}")
except Exception as e:
    print(f"Error: {e}")

print(f"\nGit status:")
result = subprocess.run(['git', 'status'], capture_output=True, text=True, cwd='.')
print(result.stdout)
if result.stderr:
    print(f"Errors: {result.stderr}")
