import threading
import time
import numpy as np
from queue import Empty
from app.services.serial_service import serial_queue
from app.services.dsp_service import dsp_service
from app.services.ml_service import ml_service
from app.services.streaming import streaming_service
import collections

class ProcessingPipeline:
    def __init__(self):
        self.running = False
        
        # We batch e.g. 50 samples before DSP & Streaming (~250ms at 200Hz)
        self.batch_size = 50
        self.raw_buffer = []
        
        # Keep track of recent RR intervals (dummy logic for now, waiting on true Pan-Tompkins peak detector)
        self.recent_rr = collections.deque(maxlen=20)
        # Mock RR fill so ML doesn't complain
        self.recent_rr.extend(np.random.normal(800, 50, 5).tolist())
        
        # 5-second ML sliding window
        self.last_ml_time = time.time()
        self.ml_window = 5.0

    def processing_worker(self):
        """Main orchestrator running in a background daemon thread."""
        while self.running:
            try:
                # Block for up to 100ms
                val = serial_queue.get(timeout=0.1)
                self.raw_buffer.append(val)
                
                # If we hit batch size boundary, process!
                if len(self.raw_buffer) >= self.batch_size:
                    chunk = np.array(self.raw_buffer)
                    self.raw_buffer = [] # Reset quickly
                    
                    # 1. Digital Signal Processing
                    filtered_chunk, sqi_status = dsp_service.process_chunk(chunk)
                    
                    # 2. Check time for ML classification (every 5s)
                    current_status = "NORMAL"
                    current_bpm = 75
                    if time.time() - self.last_ml_time > self.ml_window:
                        self.last_ml_time = time.time()
                        ml_res = ml_service.predict_arrhythmia(list(self.recent_rr))
                        if isinstance(ml_res, dict):
                            current_status = ml_res["classification"]
                            current_bpm = ml_res["bpm"]
                    
                    # 3. Stream to Firebase
                    payload = {
                        "timestamp": int(time.time() * 1000),
                        "ecg_chunk": filtered_chunk.tolist() if sqi_status == "GOOD" else [],
                        "status": sqi_status if sqi_status != "GOOD" else current_status,
                        "bpm": current_bpm
                    }
                    
                    # Offload to network thread
                    streaming_service.stream_batch(payload)
                    
            except Empty:
                continue
            except Exception as e:
                print(f"Pipeline error: {e}")
                time.sleep(1)

    def start(self):
        self.running = True
        t = threading.Thread(target=self.processing_worker, daemon=True)
        t.start()
        print("[Pipeline] Processing orchestrator started.")

pipeline = ProcessingPipeline()
