from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str
    target_role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewSetup(BaseModel):
    role: str
    company_mode: str
    difficulty: str
    interview_type: str
    answer_mode: str

class InterviewSession(BaseModel):
    id: str
    user_id: int
    role: str
    company_mode: str
    difficulty: str
    interview_type: str
    answer_mode: str
    status: str
    overall_score: float
    started_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class Question(BaseModel):
    id: int
    role: str
    category: str
    difficulty: str
    company_mode: Optional[str]
    question_text: str
    ideal_answer: Optional[str]

    class Config:
        from_attributes = True

class AnswerSubmission(BaseModel):
    question_id: int
    transcript: str
    duration_seconds: int

class FollowUpQuestionCreate(BaseModel):
    question_text: str
    category: str
    difficulty: Optional[str] = None
    ideal_answer: Optional[str] = None

class KnowledgeDocumentCreate(BaseModel):
    session_id: Optional[str] = None
    title: str
    source_type: str = "notes"
    content: str

class KnowledgeDocument(BaseModel):
    id: int
    session_id: Optional[str]
    title: str
    source_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class RetrievedContext(BaseModel):
    title: str
    source_type: str
    content: str

class AnswerResponse(BaseModel):
    id: int
    session_id: str
    question_id: int
    transcript: str
    overall_score: int
    concept_score: int
    depth_score: int
    clarity_score: int
    examples_score: int
    interview_readiness_score: int
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    ideal_answer: str
    improved_answer: str
    follow_up_question: str
    detected_weak_area: str
    question_text: Optional[str] = None
    retrieved_context: List[RetrievedContext] = Field(default_factory=list)

    class Config:
        from_attributes = True
