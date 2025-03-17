# ATS Optimize

A Chrome extension and server application for optimizing resumes and cover letters for Applicant Tracking Systems (ATS).

## Features

- **Resume Analysis**: Upload your resume and job description to get:
  - ATS Compatibility Score
  - Interview Chance Assessment
  - Missing Keywords Analysis
  - Tailored Suggestions for Improvement
  - Overall Feedback with Strengths and Areas for Improvement

- **Cover Letter Analysis**: Similar analysis for cover letters to ensure ATS optimization

- **Document Generation**: Generate ATS-optimized resumes and cover letters based on:
  - Job Description
  - Your Experience
  - Industry Best Practices

## Project Structure

```
ATS_Optimize/
├── server/
│   ├── app.py             # Flask server implementation
│   └── requirements.txt   # Python dependencies
├── extension/
│   ├── popup.html        # Extension UI
│   ├── popup.js         # Extension logic
│   ├── styles.css       # UI styling
│   └── manifest.json    # Extension configuration
└── README.md            # This file
```

## Setup

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up your OpenAI API key:
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

4. Start the Flask server:
   ```bash
   python app.py
   ```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `extension` directory
4. The extension icon should appear in your Chrome toolbar

## Usage

1. Click the extension icon in Chrome
2. Choose between:
   - **Optimize**: Analyze existing documents
   - **Create**: Generate new documents

### For Analysis
1. Upload your resume (required)
2. Upload your cover letter (optional)
3. Paste the job description
4. Click "Analyze" to get detailed feedback

### For Generation
1. Paste the job description
2. Provide your experience details
3. Click "Generate" to create optimized documents

## Development

- Server runs on `http://localhost:5002`
- Extension communicates with the server via REST API
- Uses OpenAI's API for document analysis and generation

## Dependencies

### Server
- Flask
- OpenAI
- NLTK
- Python 3.x

### Extension
- Chrome Extension Manifest V3
- Tailwind CSS
- Modern JavaScript (ES6+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use and modify for your needs. 