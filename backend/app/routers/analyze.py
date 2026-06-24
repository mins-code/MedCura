from fastapi import APIRouter, File, UploadFile, HTTPException
from app.schemas.prediction import CBCInput, PredictionResponse, ModelPrediction
from app.services.ai_engine import predict_anemia, BEST_MODEL_NAME, EXPECTED_FEATURES
from app.services.confidence import compute_confidence_multi
from app.services.pdf_parser import pdf_extractor

router = APIRouter(prefix="/api/analyze", tags=["Analyze"])


def _build_response(prediction_result: dict, model_preds: dict) -> PredictionResponse:
    """Shared helper to build a PredictionResponse from engine + confidence output."""
    confidence_result = compute_confidence_multi(model_preds, BEST_MODEL_NAME)
    return PredictionResponse(
        model_predictions=ModelPrediction(**model_preds),
        confidence_level=confidence_result["confidence_level"],
        majority_type=confidence_result["majority_type"],
        best_model_name=BEST_MODEL_NAME,
        best_model_prediction=model_preds.get(BEST_MODEL_NAME),
        final_type=confidence_result["final_type"],
        binary_probabilities=prediction_result.get("binary_probabilities"),
        weighted_anemia_prob=prediction_result.get("weighted_anemia_prob"),
        diagnosis=prediction_result.get("diagnosis"),
        is_anemic=prediction_result.get("is_anemic"),
        bayesian_imputed=prediction_result.get("bayesian_imputed"),
        explanation=confidence_result["explanation"],
        model_metrics=None,
    )


@router.post("/manual", response_model=PredictionResponse)
async def analyze_manual(data: CBCInput):
    """
    Accepts all 14 CBC values explicitly typed by the user on the Analysis page.
    Any field that is sent as 0.0 by the frontend (because it was missing from the
    report) will be detected as missing and imputed by the Bayesian Network.
    """
    cbc_dict = data.model_dump()

    # Treat explicit 0.0 values as 'missing' only for fields that should never be 0
    # (e.g. HGB=0 is physiologically impossible; the frontend sends 0 as a placeholder)
    missing_keys = [k for k, v in cbc_dict.items() if v == 0.0]
    cbc_clean = {k: v for k, v in cbc_dict.items() if v != 0.0}

    prediction_result = predict_anemia(cbc_clean)
    model_preds = prediction_result.get("model_predictions", {})
    return _build_response(prediction_result, model_preds)


@router.post("/extract")
async def analyze_extract(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    extraction_result = pdf_extractor.extract_cbc_from_pdf(file_bytes)
    if not extraction_result.get("success"):
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {extraction_result.get('error')}")

    return extraction_result


@router.post("/upload", response_model=PredictionResponse)
async def analyze_upload(file: UploadFile = File(...)):
    """
    Accepts a PDF, extracts what it can, then lets the Bayesian Network
    impute any biomarkers that could not be parsed from the document.
    """
    try:
        file_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")

    extraction_result = pdf_extractor.extract_cbc_from_pdf(file_bytes)
    if not extraction_result.get("success"):
        raise HTTPException(status_code=400, detail=f"Error extracting PDF: {extraction_result.get('error')}")

    extracted_data = extraction_result.get("data", {})

    # Build a partial dict — only include features that were actually found in the PDF
    # Missing features will be handled by the Bayesian Network inside predict_anemia
    cbc_partial = {}
    for feat in EXPECTED_FEATURES:
        entry = extracted_data.get(feat)
        if isinstance(entry, dict) and "value" in entry and entry["value"] is not None:
            try:
                val = float(entry["value"])
                if val != 0.0:                  # 0.0 treated as extraction failure
                    cbc_partial[feat] = val
            except (ValueError, TypeError):
                pass                             # skip un-parseable values

    prediction_result = predict_anemia(cbc_partial)
    model_preds = prediction_result.get("model_predictions", {})
    return _build_response(prediction_result, model_preds)
