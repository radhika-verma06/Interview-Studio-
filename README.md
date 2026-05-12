# 🎙️ Interview Studio 

Interview Studio is a premium, AI-powered mock interview platform designed for the modern talent. With a cinematic focus, turn-by-turn insights, and high-fidelity mock sessions, it enables users to practice smarter and get immediate, actionable feedback on their performance.

![Frontend UI Demo](/frontend/public/favicon.ico)

---

## 🌟 Key Features

*   **Customizable Sessions:** Choose your target role (Software Engineer, AI Engineer, etc.), company style (Big Tech, Startups, etc.), difficulty, and interview type.
*   **Dual AI Routing Engine:** Uses Groq (Llama-3.3-70b) for lightning-fast latency by default, with an OpenAI API fallback and a full offline mock evaluation mode.
*   **Dynamic RAG (Retrieval-Augmented Generation):** Upload your resume, job description, or study notes. The AI smartly pulls relevant chunks and weaves them into the interview questions and evaluations.
*   **Voice & Audio Support:** Integrated with Whisper for real-time audio transcription so you can speak your answers naturally.
*   **Live Coach & Silence Detection:** The live interviewer reacts dynamically to your pacing, silence, and text.
*   **Actionable Feedback Panel:** Get a 5-axis score breakdown (Accuracy, Depth, Clarity, Examples, Readiness), a rewritten "stronger" answer, and a customized follow-up drill directly after answering.
*   **Adaptive Drills:** The system tracks your performance per skill area and uses spaced repetition (24h/72h/7d) for low-scoring topics.

---

## 🌐 Live Deployments

*   **Frontend (Vercel):** [https://interview-studio-.vercel.app/](https://interview-studio-.vercel.app/) *(example link, update if needed)*
*   **Backend (Railway):** [Deployment active]

---

## 🏗️ Architecture

*   **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Lucide Icons.
*   **Backend:** FastAPI, Python 3.x, SQLAlchemy Core, PostgreSQL (via psycopg2) / SQLite fallback.
*   **Auth:** JWT-based stateless authentication (currently equipped with an MVP default mode for quick access).

---

## 💻 Local Development

### 1. Setup the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```env
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_optional_openai_key
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:///./interview_iq.db # Or your Postgres connection string
```

Run the backend server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Setup the Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deployment Instructions

### Vercel (Frontend)
The app is natively configured for Vercel. 
1. Import your GitHub repository to Vercel.
2. In the Vercel project settings, set the **Root Directory** to `frontend`.
3. Vercel will automatically correctly detect Next.js and deploy.

### Railway (Backend)
1. Link your GitHub repository to Railway.
2. The custom `railway.toml` config will automatically configure a Nixpacks build, `cd` into the backend directory, and run the `uvicorn` startup command.
3. Add a PostgreSQL database plugin in your Railway dashboard (the backend is equipped to handle `psycopg2` via your `requirements.txt`).
4. Set the `GROQ_API_KEY` in the Railway environment variables.
