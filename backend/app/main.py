from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze, models
from app.services.ai_engine import BEST_MODEL_NAME

app = FastAPI(title="MedCura API")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router)
app.include_router(models.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "best_model": BEST_MODEL_NAME
    }
