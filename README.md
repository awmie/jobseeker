# JobSeeker

Automated remote job board that scrapes jobs from WeWorkRemotely and displays them on a clean interface.

## Features

- Automatically scrapes jobs every 4 hours via GitHub Actions
- Dark theme UI with search & filter
- deduplication to avoid showing same jobs
- Free hosting on GitHub Pages

## Setup

1. Fork this repository
2. Enable GitHub Pages: Settings → Pages → Deploy from a branch (main /public)
3. Actions will run automatically every 4 hours

## Development

```bash
# Create venv
python3 -m venv venv
source venv/bin/activate

# Install deps
pip install -r scraper/requirements.txt

# Run scraper
python scraper/jobs.py

# Or with live reload for frontend
# Open public/index.html in browser
```

## Project Structure

```
job-board/
├── .github/workflows/scrape.yml  # GitHub Actions
├── jobs.json                   # scraped job data
├── public/                    # Static site
│   ├── index.html
│   ├── style.css
│   └── script.js
└── scraper/
    ├── jobs.py            # Python scraper
    ├── sites.yaml        # Site config
    └── requirements.txt  # Dependencies
```

## License

MIT