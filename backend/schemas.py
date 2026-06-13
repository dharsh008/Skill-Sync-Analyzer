from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class JobRoleSchema(BaseModel):
    id: int
    company_name: str
    role_title: str
    required_skills: str

    class Config:
        from_attributes = True

class SkillAnalysisResponse(BaseModel):
    programming: List[str]
    tools: List[str]
    soft_skills: List[str]

class JobMatchResponse(BaseModel):
    job_id: int
    company_name: str
    role_title: str
    match_percentage: float
    matching_skills: List[str]
    missing_skills: List[str]

class QuizQuestionSchema(BaseModel):
    id: int
    skill_id: int
    question: str
    options: List[str]

class QuizSubmit(BaseModel):
    answers: dict[int, str] # question_id: option_text
