from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid
from typing import List, Dict, Any, Optional
import tempfile
import os
from collections import Counter
import random

from . import models, schemas, database
from .database import engine, get_db
from .services.ai_service import ai_service
from .services.document_parser import extract_upload_text
from .services.rag_service import rag_service
from .routes import auth

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="InterviewIQ API")
app.include_router(auth.router)

frontend_url = os.getenv("FRONTEND_URL", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url] if frontend_url != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to InterviewIQ: AI Mock Interview Coach API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/knowledge/documents", response_model=schemas.KnowledgeDocument)
def create_knowledge_document(payload: schemas.KnowledgeDocumentCreate, db: Session = Depends(get_db)):
    user = get_or_create_mvp_user(db)
    if payload.session_id:
        session = db.query(models.InterviewSession).filter(models.InterviewSession.id == payload.session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    try:
        return rag_service.add_document(
            db,
            user_id=user.id,
            session_id=payload.session_id,
            title=payload.title,
            source_type=payload.source_type,
            content=payload.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.post("/knowledge/upload", response_model=schemas.KnowledgeDocument)
async def upload_knowledge_document(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    source_type: str = Form("notes"),
    db: Session = Depends(get_db),
):
    user = get_or_create_mvp_user(db)
    if session_id:
        session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file was empty")
    if len(raw) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File is too large. Keep context files under 8 MB.")

    try:
        content = extract_upload_text(file.filename or title or "Interview context", file.content_type, raw)
        return rag_service.add_document(
            db,
            user_id=user.id,
            session_id=session_id,
            title=title or file.filename or "Interview context",
            source_type=source_type,
            content=content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

@app.get("/knowledge/search", response_model=List[schemas.RetrievedContext])
def search_knowledge(
    query: str,
    session_id: Optional[str] = None,
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
):
    user = get_or_create_mvp_user(db)
    return rag_service.retrieve_context(db, session_id=session_id, user_id=user.id, query=query, limit=limit)

def get_or_create_mvp_user(db: Session) -> models.User:
    user = db.query(models.User).order_by(models.User.id.asc()).first()
    if user:
        return user

    user = models.User(
        name="MVP User",
        email="mvp-user@interviewiq.local",
        password_hash="mvp-password-hash",
        target_role="AI Engineer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def _normalize_category(value: str) -> str:
    normalized = value.strip().lower()
    mapping = {
        "system optimization": "System Design",
        "system design": "System Design",
        "ml fundamentals": "Fundamentals",
        "optimization": "Fundamentals",
        "deep learning": "Deep Learning",
        "nlp": "NLP",
        "behavioral": "Behavioral",
        "resume-based": "Resume-based",
    }
    return mapping.get(normalized, value.strip().title())

def _build_drill_plan(answer_payloads: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not answer_payloads:
        return {"focus_areas": [], "redo_queue": []}

    weak_areas = [
        _normalize_category(a.get("detected_weak_area", ""))
        for a in answer_payloads
        if a.get("detected_weak_area")
    ]
    weakest = [area for area, _ in Counter(weak_areas).most_common(3)]

    focus_areas = [
        {
            "area": area,
            "action": f"Run two focused practice answers on {area} and emphasise trade-offs.",
            "goal": "Lift this area by at least 10 points over the next two sessions.",
        }
        for area in weakest
    ]

    redo_queue = []
    for idx, answer in enumerate(sorted(answer_payloads, key=lambda a: a.get("overall_score", 0))[:3]):
        schedule = "24h" if idx == 0 else "72h" if idx == 1 else "7d"
        redo_queue.append(
            {
                "question_id": answer.get("question_id"),
                "question_text": answer.get("question_text", "Practice this question again."),
                "score": answer.get("overall_score", 0),
                "due_in": schedule,
            }
        )

    return {"focus_areas": focus_areas, "redo_queue": redo_queue}

def _select_best_question_candidate(
    session: models.InterviewSession,
    candidates: List[models.Question],
) -> Optional[models.Question]:
    if not candidates:
        return None

    weak_area_targets = {
        _normalize_category(a.detected_weak_area)
        for a in session.answers[-3:]
        if a.detected_weak_area
    }

    def score_candidate(question: models.Question) -> int:
        score = 0
        if question.role == session.role:
            score += 3
        if session.difficulty == "Mixed" or question.difficulty == session.difficulty:
            score += 2
        if question.company_mode in {session.company_mode, "General"}:
            score += 2
        if weak_area_targets and question.category in weak_area_targets:
            score += 3
        return score

    scored = sorted(candidates, key=lambda q: score_candidate(q), reverse=True)
    top_score = score_candidate(scored[0])
    top_candidates = [q for q in scored if score_candidate(q) == top_score]
    return random.choice(top_candidates)

def _parse_excluded_ids(exclude_ids: str) -> List[int]:
    ids = []
    for value in exclude_ids.split(","):
        value = value.strip()
        if not value:
            continue
        try:
            parsed = int(value)
        except ValueError:
            continue
        if parsed > 0:
            ids.append(parsed)
    return ids

async def _create_generated_question(
    db: Session,
    session: models.InterviewSession,
    focus_area: Optional[str] = None,
    previous_questions: Optional[List[str]] = None,
    retrieved_context: Optional[List[Dict[str, str]]] = None,
) -> models.Question:
    payload = await ai_service.generate_question(
        role=session.role,
        company_mode=session.company_mode,
        difficulty=session.difficulty,
        interview_type=session.interview_type,
        focus_area=focus_area,
        previous_questions=previous_questions or [],
        retrieved_context=retrieved_context or [],
    )
    question = models.Question(
        role=payload.get("role", session.role),
        category=payload.get("category", focus_area or session.interview_type or "General"),
        difficulty=payload.get("difficulty", session.difficulty if session.difficulty != "Mixed" else "Medium"),
        company_mode=payload.get("company_mode", session.company_mode),
        question_text=payload.get("question_text", "Walk me through a challenging project and the trade-offs you made."),
        ideal_answer=payload.get("ideal_answer", "A strong answer is structured, specific, trade-off aware, and measurable."),
        rubric_keywords=[],
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

# --- Interview Endpoints ---

@app.post("/interviews/start", response_model=schemas.InterviewSession)
def start_interview(setup: schemas.InterviewSetup, db: Session = Depends(get_db)):
    user = get_or_create_mvp_user(db)
    session_id = str(uuid.uuid4())
    db_session = models.InterviewSession(
        id=session_id,
        user_id=user.id,
        role=setup.role,
        company_mode=setup.company_mode,
        difficulty=setup.difficulty,
        interview_type=setup.interview_type,
        answer_mode=setup.answer_mode,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@app.get("/interviews/{session_id}", response_model=schemas.InterviewSession)
def get_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/interviews/{session_id}/question", response_model=schemas.Question)
async def get_next_question(
    session_id: str,
    exclude_ids: str = Query("", description="Comma-separated question ids already shown in this client session."),
    db: Session = Depends(get_db),
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    user = get_or_create_mvp_user(db)
    
    answered_q_ids = [a.question_id for a in session.answers]
    blocked_ids = set(answered_q_ids + _parse_excluded_ids(exclude_ids))
    previous_questions = []
    if blocked_ids:
        previous_questions = [
            q.question_text
            for q in db.query(models.Question).filter(models.Question.id.in_(blocked_ids)).all()
        ]

    focus_area = session.answers[-1].detected_weak_area if session.answers else session.interview_type
    retrieved_context = rag_service.retrieve_context(
        db,
        session_id=session_id,
        user_id=user.id,
        query=f"{session.role} {session.company_mode} {session.interview_type} {focus_area} {' '.join(previous_questions[-2:])}",
        limit=4,
    )
    if retrieved_context:
        return await _create_generated_question(db, session, focus_area, previous_questions, retrieved_context)

    role_filters = [models.Question.role == session.role, models.Question.role == "General"]
    if session.role in {"AI Engineer", "ML Engineer"}:
        role_filters.append(models.Question.role == "ML Engineer")

    query = db.query(models.Question).filter(or_(*role_filters))
    if blocked_ids:
        query = query.filter(~models.Question.id.in_(blocked_ids))
    candidates = query.all()

    if not candidates:
        return await _create_generated_question(db, session, focus_area, previous_questions, retrieved_context)

    question = _select_best_question_candidate(session, candidates)
    if not question:
        return await _create_generated_question(db, session, focus_area, previous_questions, retrieved_context)
    return question

@app.post("/interviews/{session_id}/question/regenerate", response_model=schemas.Question)
async def regenerate_question(
    session_id: str,
    current_question_id: int = Query(...),
    db: Session = Depends(get_db),
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    user = get_or_create_mvp_user(db)

    current_question = db.query(models.Question).filter(models.Question.id == current_question_id).first()
    if not current_question:
        retrieved_context = rag_service.retrieve_context(
            db,
            session_id=session_id,
            user_id=user.id,
            query=f"{session.role} {session.company_mode} {session.interview_type}",
            limit=4,
        )
        return await _create_generated_question(db, session, None, [], retrieved_context)

    answered_q_ids = [a.question_id for a in session.answers]
    blocked_ids = set(answered_q_ids + [current_question_id])

    # Prefer same category + same difficulty for a true variant.
    strict_query = db.query(models.Question).filter(
        models.Question.category == current_question.category,
        models.Question.difficulty == current_question.difficulty,
        or_(
            models.Question.role == session.role,
            models.Question.role == "ML Engineer",
        ),
    )
    if blocked_ids:
        strict_query = strict_query.filter(~models.Question.id.in_(blocked_ids))
    strict_candidates = strict_query.all()

    question = _select_best_question_candidate(session, strict_candidates)
    if question:
        return question

    # Fallback to general adaptive selection, excluding current/answered.
    fallback_query = db.query(models.Question).filter(
        or_(
            models.Question.role == session.role,
            models.Question.role == "ML Engineer",
        ),
    )
    if blocked_ids:
        fallback_query = fallback_query.filter(~models.Question.id.in_(blocked_ids))
    fallback_candidates = fallback_query.all()

    question = _select_best_question_candidate(session, fallback_candidates)
    if not question:
        previous_questions = [current_question.question_text]
        previous_questions.extend(a.question.question_text for a in session.answers if a.question)
        retrieved_context = rag_service.retrieve_context(
            db,
            session_id=session_id,
            user_id=user.id,
            query=f"{current_question.question_text} {current_question.category} {session.role}",
            limit=4,
        )
        return await _create_generated_question(db, session, current_question.category, previous_questions, retrieved_context)
    return question

@app.post("/interviews/{session_id}/question/follow-up", response_model=schemas.Question)
def create_follow_up_question(
    session_id: str,
    payload: schemas.FollowUpQuestionCreate,
    db: Session = Depends(get_db),
):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    question = models.Question(
        role=session.role,
        category=payload.category or session.interview_type,
        difficulty=payload.difficulty or (session.difficulty if session.difficulty != "Mixed" else "Medium"),
        company_mode=session.company_mode,
        question_text=payload.question_text,
        ideal_answer=payload.ideal_answer or "A strong follow-up answer directly addresses the detected weakness with evidence, trade-offs, and measurable reasoning.",
        rubric_keywords=[],
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question

@app.post("/interviews/{session_id}/answer", response_model=schemas.AnswerResponse)
async def submit_answer(session_id: str, submission: schemas.AnswerSubmission, db: Session = Depends(get_db)):
    # 1. Get Session and Question
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    question = db.query(models.Question).filter(models.Question.id == submission.question_id).first()
    
    if not session or not question:
        raise HTTPException(status_code=404, detail="Session or Question not found")
    user = get_or_create_mvp_user(db)
    retrieved_context = rag_service.retrieve_context(
        db,
        session_id=session_id,
        user_id=user.id,
        query=f"{question.question_text} {submission.transcript} {question.category}",
        limit=4,
    )
    
    # 2. Evaluate Answer via AI Service
    eval_result = await ai_service.evaluate_answer(
        question=question.question_text,
        answer=submission.transcript,
        category=question.category,
        difficulty=session.difficulty,
        company_mode=session.company_mode,
        retrieved_context=retrieved_context,
    )
    
    # 3. Save Answer
    db_answer = models.Answer(
        session_id=session_id,
        question_id=submission.question_id,
        transcript=submission.transcript,
        concept_score=eval_result["concept_accuracy"],
        depth_score=eval_result["technical_depth"],
        clarity_score=eval_result["clarity"],
        examples_score=eval_result["examples"],
        interview_readiness_score=eval_result["interview_readiness"],
        overall_score=eval_result["overall_score"],
        strengths=eval_result["strengths"],
        weaknesses=eval_result["weaknesses"],
        improvement_suggestions=eval_result["improvement_suggestions"],
        ideal_answer=eval_result["ideal_answer"],
        improved_answer=eval_result["improved_user_answer"],
        follow_up_question=eval_result["follow_up_question"],
        detected_weak_area=eval_result["detected_weak_area"],
        answer_duration_seconds=submission.duration_seconds
    )
    db.add(db_answer)
    
    # 4. Update session score (average for now)
    all_answers = session.answers + [db_answer]
    session.overall_score = sum(a.overall_score for a in all_answers) / len(all_answers)
    
    db.commit()
    db.refresh(db_answer)
    return {
        "id": db_answer.id,
        "session_id": db_answer.session_id,
        "question_id": db_answer.question_id,
        "transcript": db_answer.transcript,
        "overall_score": db_answer.overall_score,
        "concept_score": db_answer.concept_score,
        "depth_score": db_answer.depth_score,
        "clarity_score": db_answer.clarity_score,
        "examples_score": db_answer.examples_score,
        "interview_readiness_score": db_answer.interview_readiness_score,
        "strengths": db_answer.strengths,
        "weaknesses": db_answer.weaknesses,
        "improvement_suggestions": db_answer.improvement_suggestions,
        "ideal_answer": db_answer.ideal_answer,
        "improved_answer": db_answer.improved_answer,
        "follow_up_question": db_answer.follow_up_question,
        "detected_weak_area": db_answer.detected_weak_area,
        "question_text": question.question_text,
        "retrieved_context": retrieved_context,
    }

@app.post("/interviews/{session_id}/complete")
def complete_interview(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "completed"
    from datetime import datetime
    session.completed_at = datetime.now()
    db.commit()
    return {"message": "Interview completed", "session_id": session_id}

@app.get("/interviews/{session_id}/summary")
def get_interview_summary(session_id: str, db: Session = Depends(get_db)):
    session = db.query(models.InterviewSession).filter(models.InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate some summary stats
    answers = session.answers
    if not answers:
        return {
            "session": session,
            "stats": {
                "avg_score": 0,
                "best_score": 0,
                "total_answered": 0
            },
            "answers": []
        }

    avg_score = sum(a.overall_score for a in answers) / len(answers)
    best_score = max(a.overall_score for a in answers)
    
    question_map = {
        q.id: q.question_text
        for q in db.query(models.Question).filter(models.Question.id.in_([a.question_id for a in answers])).all()
    }

    answer_payloads = [
        {
            "id": a.id,
            "question_id": a.question_id,
            "question_text": question_map.get(a.question_id, "Interview question"),
            "overall_score": a.overall_score,
            "strengths": a.strengths,
            "weaknesses": a.weaknesses,
            "detected_weak_area": a.detected_weak_area,
            "improvement_suggestions": a.improvement_suggestions,
            "follow_up_question": a.follow_up_question,
        }
        for a in answers
    ]

    return {
        "session": session,
        "stats": {
            "avg_score": round(avg_score, 1),
            "best_score": best_score,
            "total_answered": len(answers)
        },
        "answers": answer_payloads,
        "drill_plan": _build_drill_plan(answer_payloads),
    }

@app.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    user = get_or_create_mvp_user(db)
    user_id = user.id
    sessions = db.query(models.InterviewSession).filter(models.InterviewSession.user_id == user_id).all()
    
    if not sessions:
        return {
            "total_interviews": 0,
            "avg_score": 0,
            "best_score": 0,
            "recent_sessions": [],
            "skill_breakdown": {}
        }

    total_interviews = len(sessions)
    all_scores = [s.overall_score for s in sessions if s.overall_score > 0]
    avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
    best_score = max(all_scores) if all_scores else 0

    # Calculate real skill breakdown from recent answers
    skill_totals = {}
    skill_counts = {}
    for session in sessions:
        for answer in session.answers:
            if answer.question and answer.question.category:
                cat = _normalize_category(answer.question.category)
                if cat not in skill_totals:
                    skill_totals[cat] = 0
                    skill_counts[cat] = 0
                skill_totals[cat] += answer.overall_score
                skill_counts[cat] += 1
                
    skill_breakdown = {
        cat: int(skill_totals[cat] / skill_counts[cat])
        for cat in skill_totals
    }
    
    # Fallback to some defaults if not enough data
    if not skill_breakdown:
        skill_breakdown = {
            "Fundamentals": 0,
            "Deep Learning": 0,
            "System Design": 0
        }

    return {
        "total_interviews": total_interviews,
        "avg_score": round(avg_score, 1),
        "best_score": best_score,
        "recent_sessions": sorted(sessions, key=lambda x: x.started_at, reverse=True)[:5],
        "skill_breakdown": skill_breakdown
    }

@app.post("/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    # Create a temporary file to save the uploaded audio
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            content = await audio_file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Process the temporary file using the AI service
        transcript = await ai_service.transcribe_audio(tmp_path)
        
        # Clean up
        os.unlink(tmp_path)
        
        return {"transcript": transcript}
    except Exception as e:
        print(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")
