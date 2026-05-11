# Deployment Guide for Interview Studio

## Environment Variables

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL`: Your deployed backend URL
  - Local: `http://127.0.0.1:8000`
  - Production: Your backend deployment URL

### Backend (Groq)
- `GROQ_API_KEY`: Your Groq API key (get from groq.com)
- `DATABASE_URL`: Database connection URL (if using external DB)

## Quick Steps for Vercel Deployment

### 1. Deploy Backend to Railway (Fixed)
1. Go to railway.app
2. Click "New Project" → Connect GitHub repo
3. **IMPORTANT**: In service settings, set **Root Directory** to `backend`
4. Add environment variable: `GROQ_API_KEY=your_groq_key`
5. Deploy and copy the backend URL

### 2. Configure Frontend on Vercel
1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add: `NEXT_PUBLIC_API_URL` = your_backend_url
4. Redeploy

## Where to Add Groq API Key

### On Railway/Render (Backend):
```
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
```

### On Vercel (Frontend):
```
NEXT_PUBLIC_API_URL=https://your-backend-app.railway.app
```

## Local Development
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run dev
```

## Troubleshooting
- If API calls fail, check `NEXT_PUBLIC_API_URL` environment variable
- Add your Groq API key to backend deployment (Railway/Render)
- Check deployment logs for errors
