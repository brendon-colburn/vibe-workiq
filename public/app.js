// WorkIQ Web Client
const API_BASE = window.location.origin;

// DOM Elements
const queryInput = document.getElementById('queryInput');
const submitBtn = document.getElementById('submitBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsDiv = document.getElementById('results');
const loadingIndicator = document.getElementById('loadingIndicator');
const clearBtn = document.getElementById('clearBtn');
const statusEl = document.getElementById('status');
const toolsInfo = document.getElementById('toolsInfo');
const exampleButtons = document.querySelectorAll('.example-btn');

// State
let isQuerying = false;

// Initialize
async function init() {
    await checkHealth();
    await loadTools();
    setupEventListeners();
}

// Check server health and connection status
async function checkHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/health`);
        const data = await response.json();
        
        if (data.connected) {
            updateStatus('connected', 'Connected to WorkIQ');
        } else {
            updateStatus('warning', 'Waiting for connection');
        }
    } catch (error) {
        updateStatus('error', 'Server not available');
        console.error('Health check failed:', error);
    }
}

// Load available tools
async function loadTools() {
    try {
        const response = await fetch(`${API_BASE}/api/tools`);
        const data = await response.json();
        
        if (data.tools && data.tools.length > 0) {
            toolsInfo.textContent = `Available tools: ${data.tools.map(t => t.name).join(', ')}`;
        }
    } catch (error) {
        console.error('Failed to load tools:', error);
    }
}

// Update connection status
function updateStatus(status, text) {
    statusEl.className = `status ${status}`;
    statusEl.querySelector('.status-text').textContent = text;
}

// Setup event listeners
function setupEventListeners() {
    submitBtn.addEventListener('click', handleSubmit);
    
    queryInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    });
    
    clearBtn.addEventListener('click', () => {
        resultsDiv.innerHTML = '';
        resultsSection.style.display = 'none';
    });
    
    exampleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            queryInput.value = query;
            queryInput.focus();
        });
    });
}

// Handle query submission
async function handleSubmit() {
    const question = queryInput.value.trim();
    
    if (!question) {
        alert('Please enter a question');
        return;
    }
    
    if (isQuerying) {
        return;
    }
    
    isQuerying = true;
    submitBtn.disabled = true;
    
    // Show results section and loading indicator
    resultsSection.style.display = 'block';
    loadingIndicator.style.display = 'flex';
    resultsDiv.innerHTML = '';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    try {
        updateStatus('warning', 'Querying WorkIQ...');
        
        const response = await fetch(`${API_BASE}/api/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });
        
        const data = await response.json();
        
        loadingIndicator.style.display = 'none';
        
        if (data.success) {
            updateStatus('connected', 'Connected to WorkIQ');
            displayResults(data.response);
        } else {
            updateStatus('error', 'Query failed');
            displayError(data.error || 'Unknown error occurred');
        }
    } catch (error) {
        loadingIndicator.style.display = 'none';
        updateStatus('error', 'Connection error');
        displayError(`Failed to connect to server: ${error.message}`);
        console.error('Query failed:', error);
    } finally {
        isQuerying = false;
        submitBtn.disabled = false;
    }
}

// Display results
function displayResults(response) {
    resultsDiv.innerHTML = '';
    
    const resultText = document.createElement('div');
    resultText.textContent = response;
    resultsDiv.appendChild(resultText);
}

// Display error
function displayError(errorMessage) {
    resultsDiv.innerHTML = '';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = `
        <strong>❌ Error:</strong><br>
        ${errorMessage}
        ${errorMessage.includes('EULA') ? '<br><br>💡 You may need to accept the EULA first. Try running: <code>npx -y @microsoft/workiq mcp</code>' : ''}
    `;
    resultsDiv.appendChild(errorDiv);
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Periodic health check
setInterval(checkHealth, 30000); // Check every 30 seconds
