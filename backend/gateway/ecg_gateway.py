import sys
import os
import time
import traceback
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.gateway.serial_reader import read_serial
from backend.services.firebase_service import upload_data_async
from app.services.dsp_service import dsp_service
from ml.ecg_processing import process_ecg_batch

PATIENT_ID = "P001"
print("ECG Gateway Started! Noise reduction filtering ENABLED.")
print("Waiting for serial data...")

BATCH_SIZE = 50
raw_buffer = []
latest_bpm = 0
sample_count = 0

for data in read_serial():
    try:
        val = data["ecg"]
        raw_buffer.append(val)
        sample_count += 1

        # Log every 50 samples to show data is flowing
        if sample_count % 50 == 0:
            print(f"[DEBUG] Received {sample_count} samples so far | buffer: {len(raw_buffer)}")

        # Every 50 points (~0.25 seconds), filter and stream the data!
        if len(raw_buffer) >= BATCH_SIZE:
            chunk = np.array(raw_buffer)
            raw_buffer = []

            # BPM: process entire batch at once (not per-sample!)
            peaks, bpm = process_ecg_batch(chunk)
            if bpm is not None:
                latest_bpm = bpm

            # Apply Noise Filters (Notch, Bandpass, Moving Average)
            filtered_chunk, sqi = dsp_service.process_chunk(chunk)

            status = "NORMAL"
            if latest_bpm > 120 or (latest_bpm < 50 and latest_bpm > 0):
                status = "ALERT"
            if sqi != "GOOD":
                status = sqi

            payload = {
                "patient_id": PATIENT_ID,
                "ecg_chunk": filtered_chunk.tolist(), # Always send chunk to keep UI moving
                "bpm": latest_bpm,
                "status": status,
                "timestamp": int(time.time() * 1000)
            }

            # Non-blocking upload — fires and forgets in background thread
            upload_data_async(payload)

    except Exception as e:
        print(f"Gateway error: {e}")
        traceback.print_exc()