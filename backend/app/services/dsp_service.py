import numpy as np
from scipy.signal import butter, iirnotch, lfilter, lfilter_zi

class DSPService:
    def __init__(self, sample_rate=200):
        self.fs = sample_rate
        
        # 1. Notch Filter (50Hz powerline)
        self.notch_b, self.notch_a = iirnotch(50.0, 30.0, self.fs)
        self.notch_zi = lfilter_zi(self.notch_b, self.notch_a) * 0.0
        
        # 2. Bandpass Filter (0.5 - 40Hz)
        self.bp_b, self.bp_a = butter(2, [0.5, 40.0], btype='bandpass', fs=self.fs)
        self.bp_zi = lfilter_zi(self.bp_b, self.bp_a) * 0.0
        
        # 3. Moving Average Filter (lowpass smoothing, 5-point window)
        kernel_size = 5
        self.ma_b = np.ones(kernel_size) / kernel_size
        self.ma_a = [1.0]
        self.ma_zi = lfilter_zi(self.ma_b, self.ma_a) * 0.0

        # Pan-Tompkins specific states
        self.mwi_window = int(0.12 * self.fs)
        self.mwi_buffer = np.zeros(self.mwi_window)
        
        # Adaptive Thresholding state
        self.peaki = 0.0
        self.spki = 0.0
        self.npki = 0.0
        self.threshold_i1 = 0.0
        self.threshold_i2 = 0.0

        # Peak detection memory
        self.last_rr_ms = []

    def assess_sqi(self, raw_chunk):
        """
        Signal Quality Index evaluation.
        Evaluates a chunk of signal for flatlining or saturation.
        Assuming standard 10-bit Arduino ADC (0-1023)
        """
        if len(raw_chunk) == 0:
            return "NO_DATA"
            
        variance = np.var(raw_chunk)
        if variance < 1.0:
            return "FLATLINE"
            
        max_val = np.max(raw_chunk)
        min_val = np.min(raw_chunk)
        
        if (max_val >= 1020 or min_val <= 3) and (max_val - min_val) < 100:
            return "SATURATED"
            
        return "GOOD"
        
    def process_chunk(self, chunk: np.ndarray):
        """
        Process a chunk of raw ECG points through the stateful DSP payload.
        Returns the filtered chunk.
        """
        if len(chunk) == 0:
            return np.array([]), "GOOD"
            
        # Offset zero
        chunk_c = chunk - np.mean(chunk) if len(chunk) > 5 else chunk - 512.0
            
        sqi_status = self.assess_sqi(chunk)
        
        # If signal is garbage, don't run DSP to save memory/state corruption
        if sqi_status != "GOOD":
            return np.zeros_like(chunk), sqi_status
            
        # 1. Notch
        filtered_notch, self.notch_zi = lfilter(self.notch_b, self.notch_a, chunk_c, zi=self.notch_zi)
        
        # 2. Bandpass
        filtered_bp, self.bp_zi = lfilter(self.bp_b, self.bp_a, filtered_notch, zi=self.bp_zi)
        
        # 3. Moving Average
        filtered_ma, self.ma_zi = lfilter(self.ma_b, self.ma_a, filtered_bp, zi=self.ma_zi)
        
        return filtered_ma, sqi_status

dsp_service = DSPService(sample_rate=200)
