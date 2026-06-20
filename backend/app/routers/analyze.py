from fastapi import APIRouter, File, UploadFile, HTTPException
from app.schemas.prediction import CBCInput, PredictionResponse, ModelPrediction
from app.services.ai_engine import predict_anemia, BEST_MODEL_NAME
from app.services.confidence import compute_confidence_multi
from app.services.pdf_parser import pdf_extractor

router = APIRouter(prefix="/api/analyze", tags=["Analyze"])

@router.post("/manual", response_model=PredictionResponse)
async def analyze_manual(data: CBCInput):
    # Pass the dict to ai_engine.predict_anemia()
    cbc_dict = data.model_dump()
    prediction_result = predict_anemia(cbc_dict)
    
    # Extract model_predictions and pass to compute_confidence_multi()
    model_preds = prediction_result.get("model_predictions", {})
    confidence_result = compute_confidence_multi(model_preds, BEST_MODEL_NAME)
    
    # Return full PredictionResponse
    return PredictionResponse(
        model_predictions=ModelPrediction(**model_preds),
        confidence_level=confidence_result["confidence_level"],
        majority_type=confidence_result["majority_type"],
        best_model_name=BEST_MODEL_NAME,
        best_model_prediction=model_preds.get(BEST_MODEL_NAME),
        final_type=confidence_result["final_type"],
        bn_confidence=prediction_result.get("bn_confidence"),
        explanation=confidence_result["explanation"],
        model_metrics=None  # Can be populated if needed, but not strictly required here
    )

@router.post("/upload", response_model=PredictionResponse)
async def analyze_upload(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
    extraction_result = pdf_extractor.extract_cbc_from_pdf(file_bytes)
    if not extraction_result.get("success"):
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {extraction_result.get('error')}")
        
    extracted_data = extraction_result.get("data", {})
    
    # Map extracted values to a CBCInput format
    # Any missing features will cause validation to fail, which is expected for strict typing
    try:
        cbc_input = CBCInput(**extracted_data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Extracted data is missing required CBC fields: {str(e)}")
        
    cbc_dict = cbc_input.model_dump()
    prediction_result = predict_anemia(cbc_dict)
    
    model_preds = prediction_result.get("model_predictions", {})
    confidence_result = compute_confidence_multi(model_preds, BEST_MODEL_NAME)
    
    return PredictionResponse(
        model_predictions=ModelPrediction(**model_preds),
        confidence_level=confidence_result["confidence_level"],
        majority_type=confidence_result["majority_type"],
        best_model_name=BEST_MODEL_NAME,
        best_model_prediction=model_preds.get(BEST_MODEL_NAME),
        final_type=confidence_result["final_type"],
        bn_confidence=prediction_result.get("bn_confidence"),
        explanation=confidence_result["explanation"],
        model_metrics=None
    )
