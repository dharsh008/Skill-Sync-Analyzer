from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, schemas, auth, nlp_service
from database import engine, get_db
import json

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Skill Sync Analyser API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": db_user.id, "name": db_user.name, "email": db_user.email}}

@app.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if file.filename.endswith(".pdf"):
        contents = await file.read()
        extracted_text = nlp_service.extract_text_from_pdf(contents)
    else:
        raise HTTPException(status_code=400, detail="Only PDF currently supported")
    
    skills = nlp_service.extract_skills(extracted_text)
    
    # Save to db
    resume = models.Resume(user_id=current_user.id, resume_text=extracted_text, parsed_data=json.dumps(skills))
    db.add(resume)
    db.commit()
    db.refresh(resume)
    
    return {"message": "Resume processed successfully", "skills": skills, "resume_id": resume.id}

@app.get("/api/jobs/match", response_model=list[schemas.JobMatchResponse])
def match_jobs(resume_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    skills = json.loads(resume.parsed_data)
    all_skills = skills['programming'] + skills['tools'] + skills['soft_skills']
    
    jobs = db.query(models.JobRole).all()
    job_dicts = [{"id": j.id, "company": j.company_name, "title": j.role_title, "skills_required": j.required_skills} for j in jobs]
    
    matches = nlp_service.match_jobs(all_skills, job_dicts)
    return matches

@app.get("/api/recommendations")
def recommendations(resume_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    resume = db.query(models.Resume).filter(models.Resume.id == resume_id, models.Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    skills = json.loads(resume.parsed_data)
    all_skills = skills['programming'] + skills['tools'] + skills['soft_skills']
    
    missing = nlp_service.get_recommendations(all_skills)
    return {"skills_to_learn": missing, "study_plan": [{"topic": m, "resource": f"https://docs.{m}.org"} for m in missing]}

@app.get("/api/quiz/{job_id}")
def get_quiz(job_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.job_id == job_id).all()
    return [{"id": q.id, "question": q.question, "options": json.loads(q.options)} for q in questions]

@app.post("/api/quiz/submit")
def submit_quiz(submission: schemas.QuizSubmit, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.id.in_(submission.answers.keys())).all()
    score = 0
    total = len(submission.answers)
    
    for q in questions:
        if q.id in submission.answers and submission.answers[q.id] == q.correct_answer:
            score += 1
            
    percentage = (score / total) * 100 if total > 0 else 0
    
    perf = models.UserPerformance(user_id=current_user.id, skill_id=0, quiz_score=percentage, match_percentage=0.0)
    db.add(perf)
    db.commit()
    
    return {"score": score, "total": total, "percentage": percentage}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
