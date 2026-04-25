(function() {
    const container = document.getElementById('jobs-container');
    const searchInput = document.getElementById('search');
    const categorySelect = document.getElementById('category');
    const filterSelect = document.getElementById('filter');
    const countSpan = document.getElementById('count');
    const lastUpdatedSpan = document.getElementById('last-updated');
    let currentTimestamp = '';
    let allJobs = [];
    let pollInterval = null;
    
    const techKeywords = {
        'software engineer': ['software', 'engineer', 'developer', 'programming'],
        'ai engineer': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural', 'llm', 'gpt', 'chatgpt', 'openai', 'anthropic', 'ai/'],
        'vibe coding': ['vibe', 'vibes', 'cursor', 'windsurf', 'ai coding', 'copilot', 'codeium', 'lovable'],
        'frontend': ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript', 'typescript', 'css', 'ui ', 'web developer'],
        'backend': ['backend', 'back-end', 'api', 'server', 'database', 'postgres', 'mysql', 'redis', 'node', 'python', 'django', 'fastapi'],
        'full stack': ['full stack', 'fullstack', 'full-stack'],
        'devops': ['devops', 'sre', 'infrastructure', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'terraform', 'ci/cd', 'pipeline'],
        'data': ['data', 'analytics', 'database', 'sql', 'postgresql', 'etl', 'pipeline'],
        'machine learning': ['machine learning', 'ml ', 'ml engineer', 'ml/', 'data scientist', 'nlp', 'natural language'],
        'product manager': ['product manager', 'product owner', 'pm ', 'product lead']
    };
    
    async function loadJobs() {
        try {
            const response = await fetch('jobs.json');
            if (!response.ok) throw new Error('Failed to load jobs');
            const data = await response.json();
            allJobs = data.jobs || [];
            renderJobs(allJobs);
            updateMeta(data);
        } catch (error) {
            console.error('Error loading jobs:', error);
            container.innerHTML = '<div class="no-jobs">Failed to load jobs. Please try again later.</div>';
        }
    }
    
    function updateMeta(data) {
        if (data.last_updated) {
            const date = new Date(data.last_updated);
            currentTimestamp = data.last_updated;
            lastUpdatedSpan.textContent = date.toLocaleString();
        }
    }
    
    function renderJobs(jobs) {
        countSpan.textContent = `${jobs.length} jobs`;
        
        if (jobs.length === 0) {
            container.innerHTML = '<div class="no-jobs">No jobs found</div>';
            return;
        }
        
        container.innerHTML = jobs.map(job => `
            <div class="job-card">
                <div class="job-info">
                    <h3><a href="${escapeHtml(job.url)}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a></h3>
                    <div class="company">${escapeHtml(job.company)}</div>
                </div>
                <div class="meta">
                    <span class="tag">${escapeHtml(job.location || 'Remote')}</span>
                    <span class="tag source">${escapeHtml(job.source)}</span>
                </div>
            </div>
        `).join('');
    }
    
    function getJobCategory(title) {
        const lower = title.toLowerCase();
        for (const [category, keywords] of Object.entries(techKeywords)) {
            for (const kw of keywords) {
                if (lower.includes(kw)) {
                    return category;
                }
            }
        }
        return 'other';
    }
    
    function filterJobs() {
        const search = searchInput.value.toLowerCase();
        const category = categorySelect.value;
        const source = filterSelect.value;
        
        let filtered = allJobs;
        
        if (search) {
            filtered = filtered.filter(job => 
                job.title.toLowerCase().includes(search) ||
                job.company.toLowerCase().includes(search)
            );
        }
        
        if (category) {
            filtered = filtered.filter(job => {
                const jobCat = getJobCategory(job.title);
                return jobCat === category;
            });
        }
        
        if (source) {
            filtered = filtered.filter(job => job.source === source);
        }
        
        renderJobs(filtered);
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function triggerScrape() {
        const btn = document.getElementById('refresh-btn');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Starting scrape...';
        
        window.open('https://github.com/awmie/jobseeker/actions/workflows/scrape.yml/dispatch', '_blank');
        
        let checkCount = 0;
        
        btn.textContent = '⏳ Waiting for jobs...';
        
        pollInterval = setInterval(async () => {
            checkCount++;
            
            if (checkCount >= 30) {
                btn.textContent = '⚠️ Check manually';
                clearInterval(pollInterval);
                return;
            }
            
            try {
                const response = await fetch('jobs.json?t=' + Date.now());
                const data = await response.json();
                
                if (data.last_updated !== currentTimestamp) {
                    allJobs = data.jobs || [];
                    renderJobs(allJobs);
                    updateMeta(data);
                    filterJobs();
                    btn.textContent = '✅ Jobs updated!';
                    clearInterval(pollInterval);
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                } else {
                    btn.textContent = `⏳ Waiting... (${checkCount * 2}s)`;
                }
            } catch (e) {
                btn.textContent = '⏳ Retrying...';
            }
        }, 2000);
    }
    
    window.triggerScrape = triggerScrape;
    
    searchInput.addEventListener('input', filterJobs);
    categorySelect.addEventListener('change', filterJobs);
    filterSelect.addEventListener('change', filterJobs);
    
    loadJobs();
})();

function toggleTheme() {
    const html = document.documentElement;
    const moon = document.getElementById('theme-icon-moon');
    const sun = document.getElementById('theme-icon-sun');
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', next);
    moon.style.display = next === 'dark' ? 'none' : 'inline';
    sun.style.display = next === 'dark' ? 'inline' : 'none';
    localStorage.setItem('theme', next);
}

document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('theme') || 'light';
    const html = document.documentElement;
    const moon = document.getElementById('theme-icon-moon');
    const sun = document.getElementById('theme-icon-sun');
    
    html.setAttribute('data-theme', saved);
    moon.style.display = saved === 'dark' ? 'none' : 'inline';
    sun.style.display = saved === 'dark' ? 'inline' : 'none';
});