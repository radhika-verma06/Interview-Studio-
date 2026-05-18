# 🎙️ Interview Studio  
### AI-Powered Mock Interview & Coaching Platform

Interview Studio is an AI-powered mock interview platform designed to help users practice technical and behavioural interviews through realistic, adaptive interview sessions.

The system combines LLM-based interviewing, resume-aware question generation, voice transcription, and structured feedback to simulate real interview experiences and help users improve communication, confidence, and technical depth.

---

## 🚀 Live Deployment

### Frontend
https://interview-studio-.vercel.app/

### Backend
FastAPI backend deployed via Railway.

---

## ✨ Core Features

### 🎯 Custom Interview Sessions
Users can configure:
- target role
- interview difficulty
- company style
- interview type
- behavioural or technical focus

### 🧠 AI Interview Engine
Supports:
- Groq Llama 3.3 70B
- OpenAI fallback routing
- adaptive interview flow
- contextual follow-up questions

### 📄 Resume & Job Description Awareness
Users can upload:
- resumes
- job descriptions
- study notes

The system uses retrieval-based context injection to personalise interview questions and evaluations.

### 🎙️ Voice Transcription
Integrated speech-to-text support using Whisper-style transcription workflows for natural spoken responses.

### 📊 Structured Feedback
Provides:
- response scoring
- communication analysis
- clarity evaluation
- technical depth analysis
- readiness feedback
- stronger rewritten answer suggestions

### 🔁 Adaptive Practice
Tracks weaker areas and recommends targeted follow-up drills.

---

## 🏗️ System Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | FastAPI |
| Database | PostgreSQL / SQLite fallback |
| AI Models | Groq Llama 3.3 70B, OpenAI |
| Authentication | JWT |
| Deployment | Vercel + Railway |
| Language | Python + JavaScript |

---

## 📦 Local Development Setup

## 1. Clone the repository

```bash
git clone https://github.com/radhika-verma06/Interview-Studio-.git
cd Interview-Studio-
```

---

## 2. Backend Setup

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_key
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:///./interview_iq.db
```

Run backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Create `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Frontend runs at:

```text
http://localhost:3000
```

---

## 📁 Project Structure

```text
Interview-Studio-/
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── railway.toml
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   └── package.json
└── README.md
```

---

## 💡 Problem This Project Solves

Most interview preparation tools provide static questions without realistic interaction or detailed coaching.

Interview Studio focuses on:
- adaptive questioning
- personalised interview simulation
- actionable feedback
- realistic interview pacing
- resume-aware preparation

The goal is to help users improve interview performance through repeated AI-assisted practice.

---

## ⚠️ Current Limitations

- AI feedback quality depends on transcript quality
- Requires external AI API services
- Long interview sessions may increase latency
- Voice transcription accuracy depends on microphone quality

---

## 🔮 Future Improvements

- Real-time avatar interviewer
- Multi-language interview support
- Live coding interview mode
- Team collaboration sessions
- Interview analytics dashboard
- Emotion and confidence tracking
- Calendar integration

---

## 🚀 Deployment

### Frontend Deployment
Deploy using Vercel.

### Backend Deployment
Deploy FastAPI backend using Railway or Render.

---

## 📄 License

MIT License

---

### Developed by Radhika Verma  
AI Student | Applied AI Products | Human-Centered AI Systems
