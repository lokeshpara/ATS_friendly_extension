// Background service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('ATS Resume Optimizer Extension installed');
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ANALYZE_JOB') {
        handleJobAnalysis(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

// Function to handle job analysis
async function handleJobAnalysis(jobData) {
    try {
        const response = await fetch('http://localhost:5002/api/analyze-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData)
        });

        if (!response.ok) {
            throw new Error('Failed to analyze job posting');
        }

        return await response.json();
    } catch (error) {
        console.error('Error analyzing job:', error);
        throw error;
    }
} 