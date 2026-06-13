import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pdfplumber
import io
import re

# Load small spaCy model for English. Assume it's downloaded.
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback if not downloaded yet
    import spacy.cli
    spacy.cli.download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

KNOWN_PROGRAMMING = ["python", "java", "javascript", "c++", "c#", "ruby", "go", "php", "typescript", "swift", "kotlin", "rust"]
KNOWN_TOOLS = ["react", "docker", "kubernetes", "aws", "git", "linux", "mongodb", "postgresql", "mysql", "fastapi", "flask", "django", "nodejs", "express", "tailwind", "redis"]
KNOWN_SOFT_SKILLS = ["leadership", "communication", "teamwork", "problem solving", "time management", "critical thinking", "adaptability", "agile"]

def extract_text_from_pdf(file_bytes):
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text.lower()

def extract_skills(text):
    # Basic tokenization
    tokens = re.findall(r'\b\w+\b', text.lower())
    
    programming = list(set([t for t in tokens if t in KNOWN_PROGRAMMING]))
    tools = list(set([t for t in tokens if t in KNOWN_TOOLS]))
    
    # Soft skills are often multi-word, so we check substring presence
    soft_skills = []
    for ss in KNOWN_SOFT_SKILLS:
        if ss in text.lower():
            soft_skills.append(ss)
            
    return {"programming": programming, "tools": tools, "soft_skills": soft_skills}

def match_jobs(user_skills_list, job_roles):
    """
    user_skills_list: list of strings
    job_roles: list of dicts {'id': 1, 'title': 'Software Engineer', 'skills_required': 'python, react, docker'}
    """
    user_skill_string = " ".join(user_skills_list)
    if not user_skill_string.strip():
        return []

    results = []
    for job in job_roles:
        job_skills = job['skills_required'].split(", ")
        
        # Calculate overlap
        matching = [s for s in user_skills_list if s in job_skills]
        missing = [s for s in job_skills if s not in user_skills_list]
        
        # Calculate TF-IDF Cosine Similarity
        vectorizer = TfidfVectorizer().fit([user_skill_string, job['skills_required']])
        vectors = vectorizer.transform([user_skill_string, job['skills_required']])
        cosine_sim = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        
        match_percentage = round(cosine_sim * 100, 2)
        
        results.append({
            "job_id": job['id'],
            "company_name": job['company'],
            "role_title": job['title'],
            "match_percentage": match_percentage,
            "matching_skills": matching,
            "missing_skills": missing
        })
        
    # Sort by match percentage descending
    results.sort(key=lambda x: x['match_percentage'], reverse=True)
    return results

def get_recommendations(user_skills_list):
    # Suggest next skill to learn based on what's missing commonly
    return ["kubernetes", "aws", "graphql", "system design"]
