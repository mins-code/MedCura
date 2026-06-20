import os
import json
from fastapi import APIRouter, HTTPException
from app.services.ai_engine import BEST_MODEL_NAME, MODELS_DIR

router = APIRouter(prefix="/api/models", tags=["Models"])

@router.get("/metrics")
async def get_metrics():
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Metrics file not found.")
    
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
        
    return metrics

@router.get("/best")
async def get_best_model():
    if not BEST_MODEL_NAME:
        raise HTTPException(status_code=500, detail="Best model name could not be determined.")
        
    return {"best_model_name": BEST_MODEL_NAME}
