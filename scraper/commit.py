import os
import json
from pathlib import Path

JOBS_PATH = Path("jobs.json")
SEEN_PATH = Path("scraper/seen_jobs.json")

def main():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        print("No GITHUB_TOKEN found")
        print("Available env vars:", list(os.environ.keys())[:10])
        return
    
    # Read current jobs.json
    if not JOBS_PATH.exists():
        print("No jobs.json to commit")
        return
    
    jobs_content = JOBS_PATH.read_text()
    seen_content = SEEN_PATH.read_text() if SEEN_PATH.exists() else "{}"
    
    # Use GitHub CLI which is pre-installed
    import subprocess
    
    # Stage files
    result = subprocess.run(["git", "add", "jobs.json", "scraper/seen_jobs.json"], 
                         capture_output=True, text=True)
    print(f"git add: {result.returncode}")
    
    # Check if there are changes
    result = subprocess.run(["git", "diff", "--cached", "--quiet"], 
                         capture_output=True, text=True)
    if result.returncode == 0:
        print("No changes to commit")
        return
    
    # Commit
    result = subprocess.run(["git", "commit", "-m", "Update jobs.json"], 
                         capture_output=True, text=True)
    print(f"git commit: {result.returncode} - {result.stdout.strip()}")
    
    # Push with token
    remote_url = subprocess.run(["git", "remote", "get-url", "origin"], 
                           capture_output=True, text=True).stdout.strip()
    push_url = remote_url.replace(
        "https://github.com/",
        f"https://x-access-token:{token}@github.com/"
    )
    result = subprocess.run(["git", "push", push_url, "main"], 
                       capture_output=True, text=True)
    print(f"git push: {result.returncode}")
    if result.returncode != 0:
        print(f"Error: {result.stderr}")

if __name__ == "__main__":
    main()