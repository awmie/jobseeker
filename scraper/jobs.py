import asyncio
import httpx
import yaml
import json
import hashlib
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

CONFIG_PATH = Path(__file__).parent / "sites.yaml"
SEEN_JOBS_PATH = Path(__file__).parent / "seen_jobs.json"
OUTPUT_PATH = Path(__file__).parent.parent / "jobs.json"


def load_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)


def load_seen_jobs():
    if SEEN_JOBS_PATH.exists():
        with open(SEEN_JOBS_PATH, "r") as f:
            return json.load(f)
    return {}


def save_seen_jobs(seen_jobs):
    with open(SEEN_JOBS_PATH, "w") as f:
        json.dump(seen_jobs, f, indent=2)


def generate_job_id(url, title, company):
    raw = f"{url}|{title}|{company}"
    return hashlib.md5(raw.encode()).hexdigest()[:12]


async def scrape_weworkremotely(client, config, max_jobs=30):
    jobs = []
    url = config["url"]
    
    try:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        articles = soup.select("article")
        
        for article in articles[:max_jobs]:
            try:
                link_elem = article.select_one('a[href*="/remote-jobs/"]')
                if not link_elem:
                    continue
                    
                href = link_elem.get("href", "")
                
                if not href or "/company/" in href or "/categories/" in href:
                    continue
                
                # Extract company name from job URL (format: /remote-jobs/companyname-jobtitle)
                parts = href.split("/")[-1].split("-")
                # First 1-2 parts are usually company name
                company = "Unknown"
                if len(parts) >= 2:
                    # Try first part as company
                    candidate = parts[0].upper()
                    if len(parts) > 2 and len(parts[1]) < 4:
                        candidate = (parts[0] + " " + parts[1]).upper()
                    company = candidate
                
                # Use URL slug as clean title
                slug = href.split("/")[-1]
                title = slug.replace("-", " ").title()
                
                link = href if href.startswith("http") else f"https://weworkremotely.com{href}"
                
                jobs.append({
                    "title": title,
                    "company": company,
                    "location": "Remote",
                    "url": link,
                    "source": "WeWorkRemotely"
                })
            except Exception:
                continue
                
    except Exception as e:
        print(f"  Error scraping WeWorkRemotely: {e}")
    
    return jobs


async def scrape_remoteok(client, config, max_jobs=30):
    return []


async def scrape_site(client, site_key, config):
    if not config.get("enabled", True):
        return []
    
    max_jobs = config.get("max_jobs", 30)
    
    if site_key == "weworkremotely":
        return await scrape_weworkremotely(client, config, max_jobs)
    elif site_key == "remoteok":
        return await scrape_remoteok(client, config, max_jobs)
    else:
        print(f"  Unknown site: {site_key}")
        return []


def deduplicate_jobs(all_jobs, seen_jobs):
    new_jobs = []
    new_seen = seen_jobs.copy()
    
    for job in all_jobs:
        job_id = generate_job_id(job["url"], job["title"], job["company"])
        
        if job_id not in new_seen:
            new_jobs.append(job)
            new_seen[job_id] = {
                "title": job["title"],
                "company": job["company"],
                "url": job["url"],
                "seen_at": datetime.now().isoformat()
            }
    
    return new_jobs, new_seen


async def main(dry_run=False):
    config = load_config()
    sites = config.get("sites", {})
    
    print(f"Starting job scrape at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Scraping {len(sites)} sites...")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        tasks = [
            scrape_site(client, site_key, site_config)
            for site_key, site_config in sites.items()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_jobs = []
    for result in results:
        if isinstance(result, list):
            all_jobs.extend(result)
    
    seen_jobs = load_seen_jobs() if not dry_run else {}
    new_jobs, new_seen = deduplicate_jobs(all_jobs, seen_jobs)
    
    output_data = {
        "jobs": all_jobs,
        "last_updated": datetime.now().isoformat(),
        "total": len(all_jobs),
        "new": len(new_jobs)
    }
    
    print(f"Found {len(all_jobs)} jobs ({len(new_jobs)} new)")
    
    OUTPUT_PATH.write_text(json.dumps(output_data, indent=2))
    print(f"Saved to {OUTPUT_PATH}")
    
    if not dry_run:
        save_seen_jobs(new_seen)
        print(f"Updated seen jobs tracking")
    
    return output_data


if __name__ == "__main__":
    import sys
    dry = "--dry-run" in sys.argv
    asyncio.run(main(dry_run=dry))