import sys
import os

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.main import app

# Vercel serverless function handler
def handler(request):
    return app(request.scope, request.receive, request.send)
