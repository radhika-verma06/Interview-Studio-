import os
import json
import re
from collections import Counter
from typing import Dict, Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class AIService:
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

        # Build provider list: Groq → Gemini → OpenAI
        self.providers: List[Dict[str, Any]] = []
        if self.groq_key:
            client = OpenAI(api_key=self.groq_key, base_url="https://api.groq.com/openai/v1")
            self.providers.append({
                "name": "Groq",
                "client": client,
                "model": "llama-3.3-70b-versatile",
                "whisper": "whisper-large-v3",
            })
            print("AI Service initialized with Groq provider")
        if self.gemini_key:
            client = OpenAI(
                api_key=self.gemini_key,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            self.providers.append({
                "name": "Gemini",
                "client": client,
                "model": "gemini-1.5-flash",
                "whisper": None,
            })
            print("AI Service initialized with Gemini provider")
        if self.openai_key:
            client = OpenAI(api_key=self.openai_key)
            self.providers.append({
                "name": "OpenAI",
                "client": client,
                "model": "gpt-4o-mini",
                "whisper": "whisper-1",
            })
            print("AI Service initialized with OpenAI provider")

        if not self.providers:
            self.providers.append({
                "name": "Mock",
                "client": None,
                "model": None,
                "whisper": None,
            })
            print("AI Service initialized in Mock mode")

        # Convenience references to primary provider
        primary = self.providers[0]
        self.client = primary["client"]
        self.model = primary["model"]
        self.whisper_model = primary["whisper"]

    # ------------------------------------------------------------------
    # Core helper: try each provider in order for chat completions
    # ------------------------------------------------------------------
    def _try_chat(
        self,
        messages: List[Dict[str, str]],
        response_format: Optional[Dict[str, str]] = None,
    ) -> Optional[Dict[str, Any]]:
        for provider in self.providers:
            client = provider["client"]
            model = provider["model"]
            if not client or not model:
                continue  # Mock – skip
            try:
                resp = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    response_format=response_format,
                )
                return json.loads(resp.choices[0].message.content)
            except Exception as e:
                print(f"{provider['name']} chat error: {e}; trying next provider")
                continue
        return None

    # ------------------------------------------------------------------
    # Core helper: try each provider in order for audio transcription
    # ------------------------------------------------------------------
    def _try_transcribe(self, audio_file_path: str) -> Optional[str]:
        for provider in self.providers:
            client = provider["client"]
            whisper_model = provider["whisper"]
            if not client or not whisper_model:
                continue
            try:
                with open(audio_file_path, "rb") as f:
                    transcript = client.audio.transcriptions.create(
                        model=whisper_model, file=f
                    )
                return transcript.text
            except Exception as e:
                print(f"{provider['name']} transcription error: {e}; trying next provider")
                continue
        return None

    # ------------------------------------------------------------------
    # Public API: generate_question
    # Flow: Mock-short-circuit → conditional RAG → _try_chat → mock fallback
    # ------------------------------------------------------------------
    async def generate_question(
        self,
        role: str,
        company_mode: str,
        difficulty: str,
        interview_type: str,
        focus_area: Optional[str],
        previous_questions: List[str],
        retrieved_context: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, str]:
        focus = focus_area or interview_type or "General"

        # Short-circuit to mock if no real providers are configured
        if self.providers[0]["name"] == "Mock":
            return self._get_mock_question(
                role, company_mode, difficulty, interview_type, focus,
                previous_questions, retrieved_context,
            )

        # Conditionally retrieve RAG context only when not supplied by caller
        if not retrieved_context:
            try:
                from app.database import SessionLocal
                from app.rag import retrieve_context
                db = SessionLocal()
                try:
                    query = f"{role} {company_mode} interview"
                    retrieved_context = retrieve_context(db, query=query, top_k=5)
                finally:
                    db.close()
            except Exception as e:
                print(f"RAG retrieval error (non-fatal): {e}")
                retrieved_context = []

        context_text = "\n\n".join(
            f"[{item.get('source_type', 'context')}: {item.get('title', 'Untitled')}]\n{item.get('content', '')}"
            for item in (retrieved_context or [])
        )

        prompt = f"""
You are a senior interviewer creating one realistic mock interview question.

Candidate role: {role}
Company style: {company_mode}
Difficulty: {difficulty}
Interview type: {interview_type}
Focus area: {focus}
Questions already asked: {previous_questions}
Retrieved candidate/job/company context:
{context_text or "No retrieved context was available."}

Create a question that is specific, interview-realistic, and not a trivia prompt.
If retrieved context exists, ground the question in it without inventing facts not present in the context.
Return ONLY valid JSON:
{{
  "role": "{role}",
  "category": "short category",
  "difficulty": "{difficulty}",
  "company_mode": "{company_mode}",
  "question_text": "one interview question",
  "ideal_answer": "concise coverage checklist for a strong answer"
}}
"""

        response = self._try_chat(
            [{"role": "system", "content": prompt}],
            response_format={"type": "json_object"},
        )
        if response:
            return response

        # All providers failed – fall back to mock
        return self._get_mock_question(
            role, company_mode, difficulty, interview_type, focus,
            previous_questions, retrieved_context,
        )

    # ------------------------------------------------------------------
    # Public API: evaluate_answer
    # ------------------------------------------------------------------
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        category: str,
        difficulty: str,
        company_mode: str,
        retrieved_context: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        if self.providers[0]["name"] == "Mock":
            return self._get_mock_evaluation(question, answer, category, retrieved_context)

        context_text = "\n\n".join(
            f"[{item.get('source_type', 'context')}: {item.get('title', 'Untitled')}]\n{item.get('content', '')}"
            for item in (retrieved_context or [])
        )

        prompt = f"""
You are a senior technical interviewer evaluating a candidate's answer.

Question: {question}
Candidate answer: {answer}
Category: {category}
Difficulty: {difficulty}
Company interview style: {company_mode}
Retrieved candidate/job/company context:
{context_text or "No retrieved context was available."}

Evaluate the answer using this rubric:
1. Accuracy (0-10)
2. Depth (0-10)
3. Clarity (0-10)
4. Examples (0-10)
5. Readiness (0-10)

Return ONLY valid JSON in this exact format:
{{
  "concept_accuracy": 0,
  "technical_depth": 0,
  "clarity": 0,
  "examples": 0,
  "interview_readiness": 0,
  "overall_score": 0,
  "strengths": ["string"],
  "weaknesses": ["string"],
  "improvement_suggestions": ["string"],
  "ideal_answer": "string",
  "improved_user_answer": "string",
  "follow_up_question": "string",
  "detected_weak_area": "string"
}}
"""

        response = self._try_chat(
            [{"role": "system", "content": prompt}],
            response_format={"type": "json_object"},
        )
        if response:
            return response

        return self._get_mock_evaluation(question, answer, category, retrieved_context)

    # ------------------------------------------------------------------
    # Public API: transcribe_audio
    # ------------------------------------------------------------------
    async def transcribe_audio(self, audio_file_path: str) -> str:
        if self.providers[0]["name"] == "Mock":
            return "Mock: Transcription demo."
        result = self._try_transcribe(audio_file_path)
        return result if result else "Error transcribing audio."

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _context_terms(self, retrieved_context: Optional[List[Dict[str, str]]]) -> List[str]:
        if not retrieved_context:
            return []
        text = " ".join(item.get("content", "") for item in retrieved_context)
        stopwords = {
            "about", "after", "also", "and", "are", "because", "from", "have",
            "into", "that", "the", "their", "this", "with", "would", "your",
        }
        terms = [
            t for t in re.findall(r"[a-zA-Z][a-zA-Z0-9_+#.-]{3,}", text.lower())
            if t not in stopwords
        ]
        return [t for t, _ in Counter(terms).most_common(12)] if terms else []

    # ------------------------------------------------------------------
    # Mock: question generation
    # ------------------------------------------------------------------
    def _get_mock_question(
        self,
        role: str,
        company_mode: str,
        difficulty: str,
        interview_type: str,
        focus_area: str,
        previous_questions: List[str],
        retrieved_context: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, str]:
        category = focus_area if focus_area and focus_area != "General" else interview_type

        if retrieved_context:
            primary_context = retrieved_context[0]
            source_label = primary_context.get("source_type", "context").replace("_", " ")
            source_title = primary_context.get("title", "uploaded context")
            snippet = " ".join(primary_context.get("content", "").split())[:260]
            return {
                "role": role,
                "category": "Resume-based" if source_label == "resume" else category,
                "difficulty": difficulty if difficulty != "Mixed" else "Medium",
                "company_mode": company_mode,
                "question_text": (
                    f"Your uploaded {source_label} ({source_title}) includes: \"{snippet}\". "
                    f"In a {role} interview at {company_mode}, walk me through the most relevant experience or decision here. "
                    "What was the problem, what trade-offs did you make, what did you measure, and what would you do differently?"
                ),
                "ideal_answer": (
                    "A strong answer ties directly to the uploaded context, makes the candidate's role explicit, "
                    "explains the decision and trade-offs, quantifies impact where possible, and reflects on learning."
                ),
            }

        if "product" in role.lower():
            question = (
                f"You're PM for an AI interview coach at {company_mode}. Candidate completion is high, "
                "but users are not improving. What would you diagnose, build, and measure?"
            )
            ideal = (
                "Clarify user segments, define readiness metrics, inspect funnel and feedback quality, "
                "prioritize interventions, guard against vanity metrics, and propose an experiment plan."
            )
        elif "data" in role.lower():
            question = (
                f"A {company_mode} team says interview practice improves hiring outcomes, "
                "but the data is noisy. How would you design the analysis?"
            )
            ideal = (
                "Define cohorts, baseline, leading and lagging metrics, confounders, "
                "experiment or quasi-experiment design, guardrails, and decision thresholds."
            )
        elif "software" in role.lower():
            question = (
                "Design the backend for a live mock interview platform. "
                "How would you handle sessions, transcript events, scoring jobs, and failures?"
            )
            ideal = (
                "Cover APIs, data model, queues, streaming events, retries, idempotency, "
                "storage, observability, privacy, and scale trade-offs."
            )
        else:
            question = (
                f"Design an adaptive AI mock interview system for {role} candidates at {company_mode}. "
                "How should it choose the next question after each answer?"
            )
            ideal = (
                "Cover candidate profile, rubric scoring, weak-area detection, question selection, "
                "follow-up probes, evaluation data, guardrails, and continuous improvement."
            )

        if previous_questions and question in previous_questions:
            question = (
                f"Follow-up on {category}: what is the hardest trade-off in your previous approach, "
                "and how would you defend it to a skeptical interviewer?"
            )

        return {
            "role": role,
            "category": category,
            "difficulty": difficulty if difficulty != "Mixed" else "Medium",
            "company_mode": company_mode,
            "question_text": question,
            "ideal_answer": ideal,
        }

    # ------------------------------------------------------------------
    # Mock: answer evaluation
    # ------------------------------------------------------------------
    def _get_mock_evaluation(
        self,
        question: str,
        answer: str,
        category: str,
        retrieved_context: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        words = [w for w in answer.strip().split() if w]
        lower_answer = answer.lower()
        lower_question = question.lower()

        has_structure = any(t in lower_answer for t in ["first", "second", "third", "finally", "step", "approach", "trade-off", "tradeoff"])
        has_metrics = any(t in lower_answer for t in ["metric", "measure", "latency", "accuracy", "conversion", "retention", "cost", "precision", "recall", "sla"])
        has_examples = any(t in lower_answer for t in ["for example", "in my", "when i", "we built", "i led", "project", "launched"])
        has_risk = any(t in lower_answer for t in ["risk", "failure", "edge case", "monitor", "guardrail", "privacy", "security", "drift"])
        has_clarification = any(t in lower_answer for t in ["assumption", "clarify", "constraint", "goal", "user", "requirement"])

        context_terms = self._context_terms(retrieved_context)
        context_hits = [t for t in context_terms if t in lower_answer]
        has_context_grounding = len(context_hits) >= 2

        answer_length_score = 4 if len(words) < 35 else 6 if len(words) < 80 else 8 if len(words) < 180 else 7
        scores = {
            "concept_accuracy": min(10, 5 + int(has_metrics) + int(has_risk) + int(len(words) >= 80) + int(category.lower() in lower_answer)),
            "technical_depth": min(10, 4 + int(has_structure) + int(has_metrics) + int(has_risk) + int(len(words) >= 100) + int("trade" in lower_answer) + int(has_context_grounding)),
            "clarity": min(10, answer_length_score + int(has_structure) + int(has_clarification)),
            "examples": min(10, 4 + int(has_examples) * 3 + int("because" in lower_answer) + int("impact" in lower_answer) + int(has_context_grounding)),
            "interview_readiness": min(10, 5 + int(has_structure) + int(has_metrics) + int(has_examples) + int(has_risk) + int(has_context_grounding)),
        }
        overall = min(100, round(sum(scores.values()) * 2))

        strengths, weaknesses, suggestions = [], [], []

        if has_structure:
            strengths.append("Your answer had a clear structure, which makes it easier for an interviewer to follow.")
        else:
            weaknesses.append("The answer needs a clearer structure before the details.")
            suggestions.append("Open with a map: goal, constraints, approach, trade-offs, and measurement.")

        if has_metrics:
            strengths.append("You included measurable success criteria instead of staying purely conceptual.")
        else:
            weaknesses.append("You did not make the success criteria measurable enough.")
            suggestions.append("Name 2-3 metrics you would track and explain what movement in those metrics means.")

        if has_examples:
            strengths.append("You grounded part of the answer in a concrete example.")
        else:
            weaknesses.append("The answer needs a concrete example or realistic product scenario.")
            suggestions.append("Add one project-style example with a decision, constraint, and outcome.")

        if has_risk:
            strengths.append("You acknowledged risk and operational failure modes.")
        else:
            weaknesses.append("You did not spend enough time on risks, edge cases, or failure modes.")
            suggestions.append("Call out the most likely failure mode and how you would detect or mitigate it.")

        if not strengths:
            strengths.append("You attempted the core prompt directly.")
        if retrieved_context and has_context_grounding:
            strengths.append("You connected the answer to the supplied interview context.")
        elif retrieved_context:
            weaknesses.append("You did not use the uploaded resume/JD/company context enough.")
            suggestions.append("Pull in 1-2 concrete details from the uploaded context and explain why they matter for this role.")

        if not weaknesses:
            weaknesses.append("The next improvement is sharpening the final recommendation and trade-off language.")
        if not suggestions:
            suggestions.append("Close with the decision you would make and the signal that would change your mind.")

        weak_area = (
            "Metrics and Evaluation" if not has_metrics else
            "Examples and Evidence" if not has_examples else
            "Risk and Trade-offs" if not has_risk else
            category
        )

        return {
            "concept_accuracy": scores["concept_accuracy"],
            "technical_depth": scores["technical_depth"],
            "clarity": scores["clarity"],
            "examples": scores["examples"],
            "interview_readiness": scores["interview_readiness"],
            "overall_score": overall,
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:3],
            "improvement_suggestions": suggestions[:3],
            "ideal_answer": self._mock_ideal_answer(question, category, lower_question),
            "improved_user_answer": self._mock_rewrite(question, answer, category),
            "follow_up_question": self._mock_follow_up_question(question, category, weak_area, lower_question),
            "detected_weak_area": weak_area,
        }

    def _mock_ideal_answer(self, question: str, category: str, lower_question: str) -> str:
        if "metric" in lower_question or category.lower() in {"metrics", "evaluation"}:
            return (
                "A strong answer defines the user or business goal, names input and output metrics, "
                "separates leading indicators from lagging outcomes, discusses guardrail metrics, "
                "and explains how the team would make decisions from the data."
            )
        if "design" in lower_question or "system" in category.lower():
            return (
                "A strong answer clarifies requirements, proposes a high-level architecture, explains data flow, "
                "handles scale and failure modes, names trade-offs, and closes with monitoring and iteration."
            )
        if "behavior" in category.lower():
            return (
                "A strong answer uses STAR: situation, task, action, and result. "
                "It should make your role explicit, quantify impact, and reflect on what you would do differently."
            )
        return (
            "A strong answer starts by clarifying the goal, gives a structured approach, grounds the reasoning "
            "in an example, discusses trade-offs or risks, and ends with how success would be measured."
        )

    def _mock_rewrite(self, question: str, answer: str, category: str) -> str:
        return (
            "I would start by clarifying the goal and constraints, then lay out a structured approach. "
            f"For this {category} question, I would explain the main decision points, call out the trade-offs, "
            "include a concrete example, and define the metrics or evidence I would use to decide whether the approach worked."
        )

    def _mock_follow_up_question(self, question: str, category: str, weak_area: str, lower_question: str) -> str:
        if weak_area == "Metrics and Evaluation":
            return "Pick three success metrics and two guardrail metrics for your answer. Why those, and what decision would each metric change?"
        if weak_area == "Examples and Evidence":
            return "Give me a concrete project-style example that proves your approach would work. What was the constraint, action, and measurable result?"
        if weak_area == "Risk and Trade-offs":
            return "What is the most likely failure mode in your approach, and how would you detect it before users are harmed?"
        if "scale" in lower_question or "system" in category.lower():
            return "Now scale your answer by 10x. What breaks first, and what would you redesign?"
        return f"Go one level deeper on {category}: what trade-off would a strong interviewer expect you to notice?"
