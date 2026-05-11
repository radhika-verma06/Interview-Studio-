from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    target_role = Column(String, default="ML Engineer")  # Flexible string
    target_company = Column(String, default="General")
    experience_level = Column(String, default="Intermediate")
    preferred_topics = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    sessions = relationship("InterviewSession", back_populates="user")
    progress = relationship("ProgressMetric", back_populates="user")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True)  # "ML Engineer", "Data Scientist", "Software Engineer", etc.
    category = Column(String, index=True)  # "Fundamentals", "System Design", etc.
    difficulty = Column(String)
    company_mode = Column(String)
    question_text = Column(Text)
    ideal_answer = Column(Text)
    rubric_keywords = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String)
    company_mode = Column(String)
    difficulty = Column(String)
    interview_type = Column(String)
    answer_mode = Column(String)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    overall_score = Column(Float, default=0.0)
    status = Column(String, default="in_progress")

    user = relationship("User", back_populates="sessions")
    answers = relationship("Answer", back_populates="session")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    audio_url = Column(String, nullable=True)
    transcript = Column(Text)
    
    # Scores
    concept_score = Column(Integer)
    depth_score = Column(Integer)
    clarity_score = Column(Integer)
    examples_score = Column(Integer)
    interview_readiness_score = Column(Integer)
    overall_score = Column(Integer)
    
    # Feedback
    strengths = Column(JSON, default=[])
    weaknesses = Column(JSON, default=[])
    improvement_suggestions = Column(JSON, default=[])
    ideal_answer = Column(Text)
    improved_answer = Column(Text)
    follow_up_question = Column(Text)
    detected_weak_area = Column(String)
    
    answer_duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("Question")

class ProgressMetric(Base):
    __tablename__ = "progress_metrics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    skill_area = Column(String)
    score = Column(Float)
    session_id = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="progress")

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=True, index=True)
    title = Column(String)
    source_type = Column(String, default="notes")
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")

class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id"), index=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=True, index=True)
    chunk_index = Column(Integer)
    content = Column(Text)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("KnowledgeDocument", back_populates="chunks")
