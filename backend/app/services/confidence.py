from collections import Counter
from typing import Dict, Any

def compute_confidence_multi(model_predictions: Dict[str, int], best_model_name: str) -> Dict[str, Any]:
    """
    Computes majority vote and confidence level based on 4 model predictions.
    
    4/4 agreement = HIGH confidence.
    3/4 agreement = MEDIUM confidence.
    2/4 agreement = LOW confidence (use the best_model_name's prediction as the final type).
    0-1/4 agreement = REFER (All models disagree, physician review required).
    """
    predictions = list(model_predictions.values())
    counts = Counter(predictions)
    
    majority_type = None
    agreement_count = 0
    final_type = None
    
    if len(counts) > 0:
        most_common = counts.most_common(1)[0]
        majority_type = most_common[0]
        agreement_count = most_common[1]
        
    best_model_pred = model_predictions.get(best_model_name)
    
    if agreement_count == 4:
        confidence_level = "HIGH"
        final_type = majority_type
        dissenting_models = []
        explanation = "All 4 models agreed on the prediction."
        
    elif agreement_count == 3:
        confidence_level = "MEDIUM"
        final_type = majority_type
        dissenting_models = [model for model, pred in model_predictions.items() if pred != majority_type]
        explanation = f"3 out of 4 models agreed. Dissenting models: {', '.join(dissenting_models)}."
        
    elif agreement_count == 2:
        confidence_level = "LOW"
        final_type = best_model_pred
        dissenting_models = [model for model, pred in model_predictions.items() if pred != final_type]
        explanation = f"Only 2 models agreed. Using the best model ({best_model_name}) prediction as the final output."
        
    else:
        confidence_level = "REFER"
        final_type = None
        dissenting_models = list(model_predictions.keys())
        explanation = "High disagreement among models. Physician review required."

    return {
        "final_type": final_type,
        "confidence_level": confidence_level,
        "agreement_count": agreement_count,
        "majority_type": majority_type,
        "dissenting_models": dissenting_models,
        "explanation": explanation
    }
