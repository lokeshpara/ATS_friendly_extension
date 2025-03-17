// Content script to interact with job posting pages

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_JOB_DETAILS') {
        const jobDetails = extractJobDetails();
        sendResponse(jobDetails);
    }
    return true;
});

// Function to extract job details from common job boards
function extractJobDetails() {
    let jobTitle = '';
    let jobDescription = '';
    let company = '';

    // LinkedIn
    if (window.location.hostname.includes('linkedin.com')) {
        jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.jobs-description__content')?.textContent?.trim() || '';
        company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() || '';
    }
    // Indeed
    else if (window.location.hostname.includes('indeed.com')) {
        jobTitle = document.querySelector('.jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
        jobDescription = document.querySelector('#jobDescriptionText')?.textContent?.trim() || '';
        company = document.querySelector('.jobsearch-CompanyInfoContainer')?.textContent?.trim() || '';
    }
    // Glassdoor
    else if (window.location.hostname.includes('glassdoor.com')) {
        jobTitle = document.querySelector('.job-title')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.jobDescriptionContent')?.textContent?.trim() || '';
        company = document.querySelector('.employer-name')?.textContent?.trim() || '';
    }

    return {
        title: jobTitle,
        description: jobDescription,
        company: company,
        url: window.location.href,
        timestamp: new Date().toISOString()
    };
} 