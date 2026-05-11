from sqlalchemy.orm import Session
from .database import SessionLocal, engine
from . import models

def seed_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    questions = [
        # ML Engineer - Fundamentals
        {
            "role": "ML Engineer",
            "category": "Fundamentals",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Explain the difference between L1 and L2 regularization. When would you prefer one over the other?",
            "ideal_answer": "L1 (Lasso) adds absolute value of coefficients to loss, promoting sparsity. L2 (Ridge) adds squared value, discouraging large weights. Use L1 for feature selection, L2 for general stability."
        },
        {
            "role": "ML Engineer",
            "category": "Fundamentals",
            "difficulty": "Easy",
            "company_mode": "General",
            "question_text": "What is overfitting, and how do you detect it during training?",
            "ideal_answer": "Overfitting is when a model learns noise in training data. Detect it by comparing training vs validation loss; if training loss decreases while validation loss increases, the model is overfitting."
        },
        # ML Engineer - Deep Learning
        {
            "role": "ML Engineer",
            "category": "Deep Learning",
            "difficulty": "Hard",
            "company_mode": "General",
            "question_text": "Explain the vanishing gradient problem in deep neural networks. How do residual connections help?",
            "ideal_answer": "Vanishing gradient occurs when gradients become extremely small during backpropagation through many layers, preventing weights from updating. Residual connections creating identity paths for gradients to flow more easily."
        },
        # Canva Mode
        {
            "role": "ML Engineer",
            "category": "System Design",
            "difficulty": "Medium",
            "company_mode": "Canva",
            "question_text": "How would you design a recommendation system for Canva templates based on a user's recent design history?",
            "ideal_answer": "I would use a two-tower model approach... Retrieval picks top N candidates using embeddings, and Ranking scores them using a deep neural network."
        },
        # Atlassian Mode
        {
            "role": "ML Engineer",
            "category": "NLP",
            "difficulty": "Medium",
            "company_mode": "Atlassian",
            "question_text": "Design an AI assistant for Jira that can automatically suggest which team to assign a new ticket based on its summary and description.",
            "ideal_answer": "This is a text classification problem. I would use BERT-based embeddings for the text and a softmax layer over team IDs..."
        },
        # Software Engineer - Role Flexibility Demo
        {
            "role": "Software Engineer",
            "category": "Data Structures",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Explain the difference between a Hash Map and a Binary Search Tree. When is one better than the other?",
            "ideal_answer": "Hash Map offers O(1) average lookup but no ordering. BST offers O(log N) lookup and keeps elements sorted. Use Hash Map for raw speed, BST for range queries."
        },
        {
            "role": "Software Engineer",
            "category": "System Design",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Design a rate limiter for a public API. What algorithms and storage choices would you consider?",
            "ideal_answer": "Discuss token bucket, leaky bucket, fixed/sliding windows, Redis or in-memory trade-offs, distributed consistency, burst handling, and observability."
        },
        {
            "role": "AI Engineer",
            "category": "RAG Systems",
            "difficulty": "Medium",
            "company_mode": "OpenAI",
            "question_text": "Design a retrieval-augmented assistant that gives interview feedback. How would you evaluate quality and reduce hallucinations?",
            "ideal_answer": "Cover ingestion, chunking, embeddings, retrieval, reranking, prompt construction, eval sets, human review, abstention, citations, latency, and cost."
        },
        {
            "role": "AI Engineer",
            "category": "Evaluation",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "A feedback model sounds confident but gives generic advice. How would you diagnose and improve it?",
            "ideal_answer": "Define a rubric, inspect examples, compare to expert labels, add structured feedback, measure calibration and specificity, and run user-facing A/B tests."
        },
        {
            "role": "AI Engineer",
            "category": "Safety",
            "difficulty": "Hard",
            "company_mode": "OpenAI",
            "question_text": "How would you design guardrails for an AI coach that must not fabricate credentials, scores, or hiring guarantees?",
            "ideal_answer": "Use policy constraints, refusal/abstention paths, grounded outputs, uncertainty language, red-team tests, logging, monitoring, and clear user messaging."
        },
        {
            "role": "Product Manager",
            "category": "Product Sense",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "How would you improve an AI mock interview product for senior candidates?",
            "ideal_answer": "Segment users, identify pain points, define success metrics, prioritize high-leverage features, test with candidates, and iterate from retention and outcome data."
        },
        {
            "role": "Product Manager",
            "category": "Metrics",
            "difficulty": "Medium",
            "company_mode": "Google",
            "question_text": "What metrics would you use to evaluate whether an interview prep product is truly improving candidate readiness?",
            "ideal_answer": "Include activation, practice completion, feedback quality, score improvement, confidence, interview outcomes, retention, and guard against vanity metrics."
        },
        {
            "role": "Data Analyst",
            "category": "Experimentation",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "A new onboarding flow increased activation but reduced paid conversion. How would you investigate?",
            "ideal_answer": "Validate definitions, inspect funnel segments, check experiment design, quantify trade-offs, examine cohorts, and recommend a follow-up test."
        },
        {
            "role": "Data Analyst",
            "category": "Metrics",
            "difficulty": "Easy",
            "company_mode": "General",
            "question_text": "How would you define and monitor retention for a weekly interview practice product?",
            "ideal_answer": "Define active use, cohort windows, frequency, returning behavior, activation linkage, segmentation, and dashboards with actionable thresholds."
        },
        {
            "role": "Consultant",
            "category": "Case",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "A SaaS company has flat revenue despite growing signups. How would you structure the analysis?",
            "ideal_answer": "Break revenue into acquisition, activation, conversion, retention, pricing, and expansion. Prioritize hypotheses and data needed for each branch."
        },
        {
            "role": "UX Researcher",
            "category": "Research Planning",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "How would you research why candidates abandon a mock interview flow before answering the first question?",
            "ideal_answer": "Use funnel data, usability sessions, interviews, survey signals, task analysis, and triangulate anxiety, clarity, trust, and effort barriers."
        },
        {
            "role": "Marketing",
            "category": "Growth Strategy",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "How would you launch an AI interview coach to students and career switchers with a limited budget?",
            "ideal_answer": "Define segments, positioning, channels, referral loops, content strategy, partnerships, conversion metrics, and rapid creative testing."
        },
        {
            "role": "Sales",
            "category": "Discovery",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Sell an AI interview coach to a university career center. How would you run discovery and handle objections?",
            "ideal_answer": "Uncover goals, student outcomes, workflow, budget, stakeholders, success criteria, risks, and map objections to evidence and pilot design."
        },
        {
            "role": "Operations",
            "category": "Process Improvement",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Interview feedback reports are delayed and inconsistent. How would you redesign the operating process?",
            "ideal_answer": "Map the workflow, identify bottlenecks, define SLAs and quality checks, automate repeatable steps, assign ownership, and monitor defects."
        },
        {
            "role": "ML Engineer",
            "category": "MLOps",
            "difficulty": "Medium",
            "company_mode": "General",
            "question_text": "Design a monitoring plan for a production classifier. What would you alert on and when would you retrain?",
            "ideal_answer": "Track data drift, prediction drift, calibration, business metrics, latency, errors, label feedback, thresholds, and retraining criteria."
        }
    ]

    added = 0
    for q in questions:
        exists = db.query(models.Question).filter(models.Question.question_text == q["question_text"]).first()
        if exists:
            continue
        db_q = models.Question(**q)
        db.add(db_q)
        added += 1
    
    # Create a default user
    if not db.query(models.User).filter(models.User.email == "demo@interviewiq.ai").first():
        user = models.User(
            name="Demo User",
            email="demo@interviewiq.ai",
            password_hash="mock_hash",
            target_role="ML Engineer"
        )
        db.add(user)

    db.commit()
    print(f"Database seeded successfully. Added {added} questions.")
    db.close()

if __name__ == "__main__":
    seed_data()
