// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    // First, verify the server is running
    fetch(`${window.config.API_BASE_URL}/test`)
        .then(response => response.json())
        .then(data => {
            console.log('Server status:', data);
        })
        .catch(error => {
            console.error('Server connection error:', error);
        });

    const optimizeBtn = document.getElementById('optimizeBtn');
    const createBtn = document.getElementById('createBtn');
    const optimizeSection = document.getElementById('optimizeSection');
    const createSection = document.getElementById('createSection');
    const resultsSection = document.getElementById('resultsSection');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const generateBtn = document.getElementById('generateBtn');

    // Tab switching
    optimizeBtn.addEventListener('click', () => {
        optimizeBtn.classList.add('active');
        createBtn.classList.remove('active');
        optimizeSection.classList.add('active');
        createSection.classList.remove('active');
        resultsSection.classList.add('hidden');
    });

    createBtn.addEventListener('click', () => {
        createBtn.classList.add('active');
        optimizeBtn.classList.remove('active');
        createSection.classList.add('active');
        optimizeSection.classList.remove('active');
        resultsSection.classList.add('hidden');
    });

    // Analyze existing documents
    analyzeBtn.addEventListener('click', async () => {
        const resumeFile = document.getElementById('resumeUpload').files[0];
        const coverLetterFile = document.getElementById('coverLetterUpload').files[0];
        const jobDescription = document.getElementById('jobDescription').value;

        if (!resumeFile || !jobDescription) {
            alert('Please upload a resume and provide a job description.');
            return;
        }

        analyzeBtn.classList.add('loading');
        try {
            const result = await analyzeDocuments(resumeFile, coverLetterFile, jobDescription);
            displayResults(result);
            resultsSection.classList.remove('hidden');
        } catch (error) {
            console.error('Analysis error:', error);
            alert(error.message);
        } finally {
            analyzeBtn.classList.remove('loading');
        }
    });

    // Generate new documents
    generateBtn.addEventListener('click', async () => {
        const jobDescription = document.getElementById('newJobDescription').value;
        const experience = document.getElementById('experience').value;

        if (!jobDescription || !experience) {
            alert('Please provide both job description and experience details.');
            return;
        }

        generateBtn.classList.add('loading');
        try {
            const result = await generateDocuments(jobDescription, experience);
            displayResults(result);
            resultsSection.classList.remove('hidden');
        } catch (error) {
            console.error('Generation error:', error);
            alert(error.message);
        } finally {
            generateBtn.classList.remove('loading');
        }
    });
});

// Function to analyze uploaded documents
async function analyzeDocuments(resume, coverLetter, jobDescription) {
    try {
        // Convert files to text
        const resumeText = await readFileAsText(resume);
        const coverLetterText = coverLetter ? await readFileAsText(coverLetter) : null;

        console.log('Making request to:', `${window.config.API_BASE_URL}/analyze`);
        const requestData = {
            resume: resumeText,
            coverLetter: coverLetterText,
            jobDescription: jobDescription
        };
        console.log('Request payload:', requestData);

        // Call the API endpoint
        const response = await fetch(`${window.config.API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to analyze documents');
        }

        if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid response format from server');
        }

        return responseData;
    } catch (error) {
        console.error('Analysis error:', error);
        throw new Error('Failed to analyze documents: ' + error.message);
    }
}

// Function to generate new documents
async function generateDocuments(jobDescription, experience) {
    try {
        console.log('Making request to:', `${window.config.API_BASE_URL}/generate`);
        const requestData = {
            jobDescription: jobDescription,
            experience: experience
        };
        console.log('Request payload:', requestData);

        const response = await fetch(`${window.config.API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to generate documents');
        }

        if (!responseData || typeof responseData !== 'object') {
            throw new Error('Invalid response format from server');
        }

        // Initialize arrays if they don't exist
        responseData.missingKeywords = responseData.missingKeywords || [];
        responseData.suggestions = responseData.suggestions || [];

        return responseData;
    } catch (error) {
        console.error('Generation error:', error);
        throw new Error('Failed to generate documents: ' + error.message);
    }
}

// Helper function to read file as text
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Function to display results
function displayResults(result) {
    console.log('Received result:', result);  // Debug log
    
    if (!result) {
        console.error('No result data received');
        alert('Error: No data received from the server');
        return;
    }

    // Clear previous results
    const resultsSection = document.getElementById('resultsSection');
    if (!resultsSection) {
        console.error('Results section not found');
        alert('Error: Results section not found');
        return;
    }

    // Always show the results section first
    resultsSection.classList.remove('hidden');
    
    // Check if this is a generation result (has generatedResume or generatedCoverLetter)
    const isGenerationResult = result.generatedResume || result.generatedCoverLetter;

    if (isGenerationResult) {
        // Display for generated documents
        resultsSection.innerHTML = '';

        if (result.generatedResume) {
            const resumeSection = document.createElement('div');
            resumeSection.className = 'bg-white rounded-lg p-4 shadow-md mb-4';
            resumeSection.innerHTML = `
                <h2 class="text-xl font-semibold mb-3">Generated Resume</h2>
                <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">${result.generatedResume}</div>
            `;
            resultsSection.appendChild(resumeSection);
        }

        if (result.generatedCoverLetter) {
            const coverLetterSection = document.createElement('div');
            coverLetterSection.className = 'bg-white rounded-lg p-4 shadow-md mb-4';
            coverLetterSection.innerHTML = `
                <h2 class="text-xl font-semibold mb-3">Generated Cover Letter</h2>
                <div class="bg-gray-50 p-4 rounded whitespace-pre-wrap">${result.generatedCoverLetter}</div>
            `;
            resultsSection.appendChild(coverLetterSection);
        }

        if (result.suggestions && result.suggestions.length > 0) {
            const suggestionsSection = document.createElement('div');
            suggestionsSection.className = 'bg-white rounded-lg p-4 shadow-md mb-4';
            suggestionsSection.innerHTML = `
                <h2 class="text-xl font-semibold mb-3">Optimization Tips</h2>
                <ul class="list-disc pl-4">
                    ${result.suggestions.map(suggestion => `<li class="text-gray-700">${suggestion}</li>`).join('')}
                </ul>
            `;
            resultsSection.appendChild(suggestionsSection);
        }
        
        return;
    }

    // Display for analysis results
    resultsSection.innerHTML = `
        <div class="bg-white rounded-lg p-4 shadow-md mb-4">
            <h2 class="text-xl font-semibold mb-3">Resume Analysis</h2>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="score-card">
                    <h3>ATS Score</h3>
                    <div id="resumeAtsScore" class="score">0%</div>
                </div>
                <div class="score-card">
                    <h3>Interview Chance</h3>
                    <div id="resumeInterviewScore" class="score">0%</div>
                </div>
            </div>
            <div class="mb-4">
                <h3 class="font-semibold mb-2">Missing Keywords</h3>
                <div id="resumeKeywordsList" class="keywords-container"></div>
            </div>
            <div class="mb-4">
                <h3 class="font-semibold mb-2">Suggested Improvements</h3>
                <ul id="resumeSuggestionsList" class="list-disc pl-4"></ul>
            </div>
        </div>

        <div class="bg-white rounded-lg p-4 shadow-md mb-4">
            <h2 class="text-xl font-semibold mb-3">Cover Letter Analysis</h2>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="score-card">
                    <h3>ATS Score</h3>
                    <div id="coverLetterAtsScore" class="score">0%</div>
                </div>
                <div class="score-card">
                    <h3>Interview Chance</h3>
                    <div id="coverLetterInterviewScore" class="score">0%</div>
                </div>
            </div>
            <div class="mb-4">
                <h3 class="font-semibold mb-2">Missing Keywords</h3>
                <div id="coverLetterKeywordsList" class="keywords-container"></div>
            </div>
            <div class="mb-4">
                <h3 class="font-semibold mb-2">Suggested Improvements</h3>
                <ul id="coverLetterSuggestionsList" class="list-disc pl-4"></ul>
            </div>
        </div>
    `;

    try {
        // Update Resume Scores
        if (result.resume) {
            document.getElementById('resumeAtsScore').textContent = `${result.resume.atsScore || 0}%`;
            document.getElementById('resumeInterviewScore').textContent = `${result.resume.interviewChance || 0}%`;

            // Display resume keywords
            const resumeKeywordsList = document.getElementById('resumeKeywordsList');
            if (Array.isArray(result.resume.keywords) && result.resume.keywords.length > 0) {
                result.resume.keywords.forEach(keyword => {
                    const keywordElement = document.createElement('span');
                    keywordElement.className = 'keyword';
                    keywordElement.textContent = keyword;
                    resumeKeywordsList.appendChild(keywordElement);
                });
            } else {
                resumeKeywordsList.innerHTML = '<p class="text-gray-500">No missing keywords found.</p>';
            }

            // Display resume suggestions
            const resumeSuggestionsList = document.getElementById('resumeSuggestionsList');
            if (Array.isArray(result.resume.suggestions) && result.resume.suggestions.length > 0) {
                result.resume.suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    li.textContent = suggestion;
                    resumeSuggestionsList.appendChild(li);
                });
            } else {
                resumeSuggestionsList.innerHTML = '<li class="text-gray-500">No suggestions available.</li>';
            }
        }

        // Update Cover Letter Scores
        if (result.coverLetter) {
            document.getElementById('coverLetterAtsScore').textContent = `${result.coverLetter.atsScore || 0}%`;
            document.getElementById('coverLetterInterviewScore').textContent = `${result.coverLetter.interviewChance || 0}%`;

            // Display cover letter keywords
            const coverLetterKeywordsList = document.getElementById('coverLetterKeywordsList');
            if (Array.isArray(result.coverLetter.keywords) && result.coverLetter.keywords.length > 0) {
                result.coverLetter.keywords.forEach(keyword => {
                    const keywordElement = document.createElement('span');
                    keywordElement.className = 'keyword';
                    keywordElement.textContent = keyword;
                    coverLetterKeywordsList.appendChild(keywordElement);
                });
            } else {
                coverLetterKeywordsList.innerHTML = '<p class="text-gray-500">No missing keywords found.</p>';
            }

            // Display cover letter suggestions
            const coverLetterSuggestionsList = document.getElementById('coverLetterSuggestionsList');
            if (Array.isArray(result.coverLetter.suggestions) && result.coverLetter.suggestions.length > 0) {
                result.coverLetter.suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    li.textContent = suggestion;
                    coverLetterSuggestionsList.appendChild(li);
                });
            } else {
                coverLetterSuggestionsList.innerHTML = '<li class="text-gray-500">No suggestions available.</li>';
            }
        }

        // Add Overall Feedback Section
        if (result.overallFeedback) {
            const overallFeedbackSection = document.createElement('div');
            overallFeedbackSection.className = 'bg-white rounded-lg p-4 shadow-md mb-4';
            overallFeedbackSection.innerHTML = `
                <h2 class="text-xl font-semibold mb-3">Overall Analysis</h2>
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Summary</h3>
                    <p class="text-gray-700">${result.overallFeedback.summary}</p>
                </div>
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Areas for Improvement</h3>
                    <ul class="list-disc pl-4">
                        ${result.overallFeedback.improvementAreas.map(area => `<li class="text-gray-700">${area}</li>`).join('')}
                    </ul>
                </div>
                <div class="mb-4">
                    <h3 class="font-semibold mb-2">Strengths</h3>
                    <ul class="list-disc pl-4">
                        ${result.overallFeedback.strengths.map(strength => `<li class="text-gray-700">${strength}</li>`).join('')}
                    </ul>
                </div>
            `;
            resultsSection.insertBefore(overallFeedbackSection, resultsSection.firstChild);
        }

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        console.log('Results displayed successfully');
    } catch (error) {
        console.error('Error displaying results:', error);
        alert('Error displaying results: ' + error.message);
    }
} 