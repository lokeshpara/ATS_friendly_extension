from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from pdfminer.high_level import extract_text
from docx import Document
import json

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configure OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Download required NLTK data
try:
    import ssl
    try:
        _create_unverified_https_context = ssl._create_unverified_context
    except AttributeError:
        pass
    else:
        ssl._create_default_https_context = _create_unverified_https_context
    
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')
except Exception as e:
    print(f"Warning: Error downloading NLTK data: {str(e)}")

def extract_text_from_file(file_data, file_type):
    """Extract text from PDF or DOCX files"""
    if file_type == 'pdf':
        return extract_text(file_data)
    elif file_type == 'docx':
        doc = Document(file_data)
        return ' '.join([paragraph.text for paragraph in doc.paragraphs])
    return file_data

def calculate_keyword_match(resume_text, job_description):
    """Calculate keyword matching score between resume and job description"""
    # Tokenize and remove stopwords
    stop_words = set(stopwords.words('english'))
    job_tokens = word_tokenize(job_description.lower())
    job_keywords = [word for word in job_tokens if word.isalnum() and word not in stop_words]
    
    resume_tokens = word_tokenize(resume_text.lower())
    resume_keywords = [word for word in resume_tokens if word.isalnum() and word not in stop_words]
    
    # Calculate matching keywords
    matching_keywords = set(job_keywords).intersection(set(resume_keywords))
    total_job_keywords = len(set(job_keywords))
    
    return len(matching_keywords) / total_job_keywords if total_job_keywords > 0 else 0

def truncate_text(text, max_chars=6000):
    """Truncate text to a maximum number of characters while keeping whole sentences."""
    if len(text) <= max_chars:
        return text
    
    truncated = text[:max_chars]
    last_period = truncated.rfind('.')
    if last_period > 0:
        return truncated[:last_period + 1]
    return truncated

@app.route('/api/analyze', methods=['POST'])
def analyze_documents():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        resume_text = data.get('resume')
        cover_letter_text = data.get('coverLetter')
        job_description = data.get('jobDescription')

        if not resume_text or not job_description:
            return jsonify({'error': 'Missing required fields'}), 400

        # Truncate texts to prevent token limit issues
        resume_text = truncate_text(resume_text)
        job_description = truncate_text(job_description)
        cover_letter_text = truncate_text(cover_letter_text)

        # Print received data for debugging
        print("Received data:", json.dumps(data, indent=2))

        # Use OpenAI to analyze the documents
        analysis_prompt = f"""
        Analyze the provided resume and cover letter against the job description. You must return ONLY a JSON object in the following format, with no additional text or explanation:

        {{
            "resume_analysis": {{
                "missing_keywords": ["keyword1", "keyword2"],
                "suggestions": ["suggestion1", "suggestion2"],
                "metrics": {{
                    "interview_chance": 75,
                    "ats_score": 80
                }}
            }},
            "cover_letter_analysis": {{
                "missing_keywords": ["keyword1", "keyword2"],
                "suggestions": ["suggestion1", "suggestion2"],
                "metrics": {{
                    "interview_chance": 75,
                    "ats_score": 80
                }}
            }},
            "overall_feedback": {{
                "summary": "A brief summary of the overall analysis",
                "improvement_areas": ["area1", "area2"],
                "strengths": ["strength1", "strength2"]
            }}
        }}

        Job Description:
        {job_description}
        
        Resume:
        {resume_text}
        
        Cover Letter:
        {cover_letter_text if cover_letter_text else "No cover letter provided"}

        Remember: Return ONLY the JSON object with no additional text or explanation. Ensure all numbers are integers between 0 and 100.
        """

        # Print OpenAI API key status
        print("OpenAI API Key status:", "Set" if client.api_key else "Not set")

        try:
            # Try using OpenAI API
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert ATS resume analyzer. You analyze resumes and cover letters against job descriptions and return the analysis in JSON format. You must return ONLY valid JSON with no additional text or explanation."},
                    {"role": "user", "content": analysis_prompt}
                ],
                response_format={ "type": "json_object" }
            )
            
            analysis = response.choices[0].message.content
            print("OpenAI Response:", analysis)  # Debug print

            try:
                # Parse the JSON response
                analysis_data = json.loads(analysis)
                
                # Extract resume data with default values
                resume_data = {
                    'atsScore': analysis_data.get('resume_analysis', {}).get('metrics', {}).get('ats_score', 50),
                    'interviewChance': analysis_data.get('resume_analysis', {}).get('metrics', {}).get('interview_chance', 50),
                    'keywords': analysis_data.get('resume_analysis', {}).get('missing_keywords', []),
                    'suggestions': analysis_data.get('resume_analysis', {}).get('suggestions', [])
                }
                
                # Extract cover letter data with default values
                cover_letter_data = {
                    'atsScore': analysis_data.get('cover_letter_analysis', {}).get('metrics', {}).get('ats_score', 50),
                    'interviewChance': analysis_data.get('cover_letter_analysis', {}).get('metrics', {}).get('interview_chance', 50),
                    'keywords': analysis_data.get('cover_letter_analysis', {}).get('missing_keywords', []),
                    'suggestions': analysis_data.get('cover_letter_analysis', {}).get('suggestions', [])
                }

                # Extract overall feedback with default values
                overall_feedback = {
                    'summary': analysis_data.get('overall_feedback', {}).get('summary', 'Analysis completed successfully.'),
                    'improvementAreas': analysis_data.get('overall_feedback', {}).get('improvement_areas', []),
                    'strengths': analysis_data.get('overall_feedback', {}).get('strengths', [])
                }

                # Print debug information
                print("Final Response Data:", json.dumps({
                    'resume': resume_data,
                    'coverLetter': cover_letter_data,
                    'overallFeedback': overall_feedback
                }, indent=2))

                return jsonify({
                    'resume': resume_data,
                    'coverLetter': cover_letter_data,
                    'overallFeedback': overall_feedback
                })

            except json.JSONDecodeError as json_error:
                print(f"Error parsing OpenAI response as JSON: {str(json_error)}")
                print("Raw response:", analysis)
                
                # Return default values if parsing fails
                default_response = {
                    'resume': {
                        'atsScore': 50,
                        'interviewChance': 50,
                        'keywords': ['skill1', 'skill2'],
                        'suggestions': ['Add more quantifiable achievements', 'Include relevant keywords from job description']
                    },
                    'coverLetter': {
                        'atsScore': 50,
                        'interviewChance': 50,
                        'keywords': ['keyword1', 'keyword2'],
                        'suggestions': ['Personalize the letter more', 'Add specific examples']
                    },
                    'overallFeedback': {
                        'summary': 'Analysis completed with default values due to parsing error.',
                        'improvementAreas': ['Add more specific achievements', 'Include more relevant keywords'],
                        'strengths': ['Basic structure is good', 'Contains relevant information']
                    }
                }
                return jsonify(default_response)

        except Exception as api_error:
            print(f"OpenAI API error: {str(api_error)}")
            return jsonify({
                'error': 'Failed to analyze documents',
                'details': str(api_error)
            }), 500

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Detailed error in analyze_documents:\n{error_details}")
        return jsonify({
            'error': str(e),
            'details': error_details
        }), 500

@app.route('/api/generate', methods=['POST'])
def generate_documents():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        job_description = data.get('jobDescription')
        user_mess = data.get('experience')

        if not job_description or not user_mess:
            return jsonify({'error': 'Missing required fields'}), 400

        # Truncate texts to prevent token limit issues
        job_description = truncate_text(job_description)
        user_mess = truncate_text(user_mess)

        generation_prompt = f"""
        Create a highly optimized ATS-friendly resume and cover letter based on the following job description and candidate experience. 
        Format the response in clear sections:

        === RESUME ===
        Create a professional, ATS-optimized resume that:
        1. Perfectly matches the job requirements
        2. Uses relevant keywords from the job description
        3. Includes quantifiable achievements
        4. Follows standard ATS-friendly formatting
        5. Highlights the most relevant skills and experience
        6. Uses the user_mess as a reference for the resume

        === COVER LETTER ===
        Create a compelling cover letter that:
        1. Addresses key job requirements
        2. Demonstrates understanding of the role
        3. Highlights relevant achievements
        4. Shows enthusiasm and cultural fit
        5. Uses the user_mess as a reference for the cover letter

        === METRICS ===
        SCORE: [Provide expected ATS match score 0-100] for the resume and cover letter you generated 
        CHANCE: [Provide estimated interview chance 0-100] for the resume and cover letter you generated 

        === OPTIMIZATION TIPS ===
        Provide 3-5 specific suggestions for further optimization

        Job Description:
        {job_description}
        
        Candidate Experience:
        {user_mess}

        Note: Format the resume and cover letter in clear sections with proper spacing and ATS-friendly formatting.
        """

        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert ATS resume writer specializing in creating highly optimized resumes that achieve maximum ATS scores. You understand both ATS algorithms and human readability requirements."},
                    {"role": "user", "content": generation_prompt}
                ]
            )
            content = response.choices[0].message.content
            print("OpenAI Generation Response:", content)  # Debug print
        except Exception as api_error:
            print(f"OpenAI API error: {str(api_error)}")
            # Create mock response based on job description and experience
            job_desc_lower = job_description.lower()
            exp_lower = user_mess.lower()
            
            # Extract potential job title
            job_title = "Software Engineer"  # default
            if "senior" in job_desc_lower:
                job_title = "Senior Software Engineer"
            elif "lead" in job_desc_lower:
                job_title = "Lead Software Engineer"
            
            # Extract key skills from job description
            skills = []
            if 'python' in job_desc_lower:
                skills.append('Python')
            if 'aws' in job_desc_lower:
                skills.append('AWS')
            if 'sql' in job_desc_lower:
                skills.append('SQL')
            if 'ml' in job_desc_lower or 'machine learning' in job_desc_lower:
                skills.append('Machine Learning')
            if 'spark' in job_desc_lower:
                skills.append('Apache Spark')
            if not skills:
                skills = ['Programming', 'Problem Solving', 'Agile Development']

            # Create mock resume
            mock_resume = f"""RESUME:
[Your Name]
[Your Email] | [Your Phone] | [Your Location]

PROFESSIONAL SUMMARY
Experienced {job_title} with expertise in {', '.join(skills[:-1])} and {skills[-1]}. Demonstrated track record of delivering high-quality software solutions and driving technical innovation.

SKILLS
Technical Skills: {', '.join(skills)}
Methodologies: Agile, Scrum, CI/CD
Tools: Git, JIRA, Docker

PROFESSIONAL EXPERIENCE

{job_title}
Current Company | MM/YYYY - Present
• Led development of {skills[0]} applications, resulting in 30% improvement in system performance
• Implemented {skills[1]} solutions for scalable cloud infrastructure
• Collaborated with cross-functional teams to deliver critical projects on time
• Mentored junior developers and conducted code reviews

Previous Role
Previous Company | MM/YYYY - MM/YYYY
• Developed and maintained {skills[2]} applications
• Improved system efficiency by 25% through optimization
• Collaborated with stakeholders to define technical requirements

EDUCATION
Bachelor's Degree in Computer Science
University Name | Graduation Year

CERTIFICATIONS
• Relevant Technical Certifications
• Cloud Platform Certifications
"""

            # Create mock cover letter
            mock_cover_letter = f"""COVER:
[Your Name]
[Your Contact Information]
[Date]

Dear Hiring Manager,

I am writing to express my strong interest in the {job_title} position at your company. With my background in {', '.join(skills)} and my passion for technology, I am confident in my ability to contribute significantly to your team.

Throughout my career, I have demonstrated expertise in {skills[0]} and {skills[1]}, delivering impactful solutions that drive business value. My experience aligns perfectly with your requirements, particularly in:

• Developing and maintaining {skills[0]} applications
• Working with {skills[1]} technologies
• Implementing best practices in software development
• Collaborating with cross-functional teams

I am particularly excited about the opportunity to work with {skills[2]} and contribute to your innovative projects. My track record of {user_mess[:100]}... demonstrates my ability to deliver results in similar environments.

Thank you for considering my application. I look forward to discussing how my skills and experience can benefit your team.

Best regards,
[Your Name]
"""

            content = f"""{mock_resume}

{mock_cover_letter}

SCORE: 85
CHANCE: 78
SUGGESTION: Customize the resume further for the specific role
SUGGESTION: Add more quantifiable achievements
SUGGESTION: Include relevant certifications
"""

        # Initialize result containers
        resume_content = ""
        cover_letter_content = ""
        suggestions = []
        ats_score = 85
        interview_chance = 75

        # Parse the response
        current_section = None
        for line in content.split('\n'):
            line = line.strip()
            if not line:
                continue

            # Check for section headers
            if line.startswith('=== ') and line.endswith(' ==='):
                current_section = line.strip('= ').strip()
                continue

            if current_section == 'RESUME':
                resume_content += line + '\n'
            elif current_section == 'COVER LETTER':
                cover_letter_content += line + '\n'
            elif current_section == 'METRICS':
                if line.startswith('SCORE:'):
                    try:
                        score = int(line.replace('SCORE:', '').strip().rstrip('%').strip('[]'))
                        ats_score = min(max(score, 0), 100)
                    except:
                        pass
                elif line.startswith('CHANCE:'):
                    try:
                        chance = int(line.replace('CHANCE:', '').strip().rstrip('%').strip('[]'))
                        interview_chance = min(max(chance, 0), 100)
                    except:
                        pass
            elif current_section == 'OPTIMIZATION TIPS':
                if line.startswith('-') or line.startswith('•'):
                    suggestion = line.lstrip('-•').strip()
                    if suggestion:
                        suggestions.append(suggestion)

        return jsonify({
            'generatedResume': resume_content.strip(),
            'generatedCoverLetter': cover_letter_content.strip(),
            'suggestions': suggestions
        })

    except Exception as e:
        print(f"Error in generate_documents: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({'status': 'ok', 'message': 'Server is running'})

if __name__ == '__main__':
    app.run(debug=True, port=5002) 