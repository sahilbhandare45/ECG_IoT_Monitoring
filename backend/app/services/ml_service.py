import numpy as np

class MLService:
    """
    Lightweight ML Service for Arrhythmia Detection based on HRV (Heart Rate Variability).
    In a real-world scenario, you would load a PyTorch ONNX model or sklearn pickle here.
    """
    def __init__(self):
        # self.model = joblib.load('models/random_forest_arrhythmia.pkl')
        pass

    def extract_features(self, rr_intervals_ms):
        """
        Extract HRV features from an array of R-R intervals in milliseconds.
        """
        if len(rr_intervals_ms) < 3:
            return None
            
        mean_rr = np.mean(rr_intervals_ms)
        sdnn = np.std(rr_intervals_ms) # Standard deviation of NN intervals
        rmssd = np.sqrt(np.mean(np.square(np.diff(rr_intervals_ms)))) # Root mean square of successive differences
        
        return {
            "mean_rr": mean_rr,
            "sdnn": sdnn,
            "rmssd": rmssd
        }

    def predict_arrhythmia(self, rr_intervals_ms):
        """
        Mock prediction function.
        Replaces actual ML inference for demonstration purposes.
        """
        features = self.extract_features(rr_intervals_ms)
        if not features:
            return "INSUFFICIENT_DATA"
            
        mean_rr = features["mean_rr"]
        sdnn = features["sdnn"]
        
        # Calculate BPM from mean R-R
        bpm = 60000 / mean_rr if mean_rr > 0 else 0
        
        # Simple heuristic classification mimicking a decision tree
        if bpm < 50:
            classification = "BRADYCARDIA"
        elif bpm > 110:
            classification = "TACHYCARDIA"
        elif sdnn > 80: # High variability often indicates Atrial Fibrillation / Arrhythmia
            classification = "ARRHYTHMIA"
        else:
            classification = "NORMAL"
            
        return {
            "classification": classification,
            "bpm": int(bpm),
            "confidence": 0.85 # Mock confidence
        }

ml_service = MLService()
