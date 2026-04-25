(function() {
    const container = document.getElementById('jobs-container');
    const searchInput = document.getElementById('search');
    const filterSelect = document.getElementById('filter');
    const countSpan = document.getElementById('count');
    const lastUpdatedSpan = document.getElementById('last-updated');
    
    let allJobs = [];
    
    async function loadJobs() {
        try {
            const response = await fetch('../jobs.json');
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
                <h3><a href="${escapeHtml(job.url)}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a></h3>
                <div class="company">${escapeHtml(job.company)}</div>
                <div class="meta">
                    <span class="tag">${escapeHtml(job.location || 'Remote')}</span>
                    <span class="tag source">${escapeHtml(job.source)}</span>
                </div>
            </div>
        `).join('');
    }
    
    function filterJobs() {
        const search = searchInput.value.toLowerCase();
        const source = filterSelect.value;
        
        let filtered = allJobs;
        
        if (search) {
            filtered = filtered.filter(job => 
                job.title.toLowerCase().includes(search) ||
                job.company.toLowerCase().includes(search)
            );
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
    
    searchInput.addEventListener('input', filterJobs);
    filterSelect.addEventListener('change', filterJobs);
    
    loadJobs();
})();