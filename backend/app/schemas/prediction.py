from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class CBCInput(BaseModel):
    WBC: float = Field(..., description="White Blood Cell count")
    LYMp: float = Field(..., description="Lymphocyte percentage")
    NEUTp: float = Field(..., description="Neutrophil percentage")
    LYMn: float = Field(..., description="Lymphocyte absolute count")
    NEUTn: float = Field(..., description="Neutrophil absolute count")
    RBC: float = Field(..., description="Red Blood Cell count")
    HGB: float = Field(..., description="Hemoglobin")
    HCT: float = Field(..., description="Hematocrit")
    MCV: float = Field(..., description="Mean Corpuscular Volume")
    MCH: float = Field(..., description="Mean Corpuscular Hemoglobin")
    MCHC: float = Field(..., description="Mean Corpuscular Hemoglobin Concentration")
    PLT: float = Field(..., description="Platelet count")
    PDW: float = Field(..., description="Platelet Distribution Width")
    PCT: float = Field(..., description="Plateletcrit")

class ModelPrediction(BaseModel):
    RandomForest: int
    KNN: int
    SVM: int
    LogisticReg: int

class PredictionResponse(BaseModel):
    model_predictions: ModelPrediction
    confidence_level: str
    majority_type: Optional[int] = None
    best_model_name: str
    best_model_prediction: Optional[int] = None
    final_type: Optional[int] = None
    bn_confidence: Optional[float] = None
    explanation: str
    model_metrics: Optional[Dict[str, Any]] = None
