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

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Google Chrome browser
- pip (Python package installer)
- Git (optional, for cloning)

### Server Setup

#### Windows

1. Open Command Prompt or PowerShell
2. Navigate to the server directory:
   ```cmd
   cd server
   ```
3. Create and activate a virtual environment:
   ```cmd
   python -m venv venv
   .\venv\Scripts\activate
   ```
4. Install required packages:
   ```cmd
   pip install -r requirements.txt
   ```
5. Set OpenAI API key:
   ```cmd
   set OPENAI_API_KEY=your-api-key-here
   ```
6. Start the server:
   ```cmd
   python app.py
   ```

#### macOS/Linux

1. Open Terminal
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
4. Install required packages:
   ```bash
   pip3 install -r requirements.txt
   ```
5. Set OpenAI API key:
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```
6. Start the server:
   ```bash
   python3 app.py
   ```

### Chrome Extension Setup

The extension setup is the same for all operating systems:

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

## Troubleshooting

### Windows
- If you get a "python not found" error, ensure Python is added to your PATH
- If you get a permission error, run Command Prompt as Administrator
- For SSL errors, you may need to install OpenSSL: `pip install pyOpenSSL`

### macOS
- If you get a "python3 not found" error, install Python using Homebrew: `brew install python3`
- For permission errors: `sudo chmod -R 755 server/`
- If pip fails, try: `pip3 install --user -r requirements.txt`

### Linux
- Install Python: `sudo apt-get install python3 python3-pip` (Ubuntu/Debian)
- For permission errors: `sudo chmod +x server/app.py`
- If pip fails: `sudo pip3 install -r requirements.txt`

### Common Issues
- Server not starting: Check if port 5002 is in use
- Extension not loading: Verify manifest.json is valid
- API errors: Verify OpenAI API key is set correctly
- File upload issues: Check file format (PDF/DOC/DOCX)

## Development

- Server runs on `http://localhost:5002`
- Extension communicates with the server via REST API
- Uses OpenAI's API for document analysis and generation

### Dependencies

#### Server
- Flask
- OpenAI
- NLTK
- Python 3.x
- pdfminer.six (for PDF processing)
- python-docx (for DOCX processing)

#### Extension
- Chrome Extension Manifest V3
- Tailwind CSS
- Modern JavaScript (ES6+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security Notes

- Never commit your OpenAI API key
- Use environment variables for sensitive data
- Keep your Python packages updated
- Follow Chrome extension security best practices

## License

MIT License - feel free to use and modify for your needs. 