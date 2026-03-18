from .serial_reader import read_serial
from ..services.firebase_service import upload_data
from ..ml.ecg_processing import process_ecg
import time

PATIENT_ID = "P001"

print("ECG Gateway Started")

last_upload_time = 0
UPLOAD_INTERVAL = 2  # seconds


for data in read_serial():

    try:

        ecg_value = data["ecg"]

        peaks, bpm = process_ecg(ecg_value)

        if bpm is None:
            continue

        # Alert detection
        status = "NORMAL"

        if bpm > 120 or bpm < 50:
            status = "ALERT"

        current_time = time.time()

        if current_time - last_upload_time >= UPLOAD_INTERVAL:

            payload = {
                "patient_id": PATIENT_ID,
                "ecg_value": ecg_value,
                "bpm": bpm,
                "status": status,
                "timestamp": int(current_time)
            }

            print(f"ECG: {ecg_value} | BPM: {bpm} | Status: {status}")

            upload_data(payload)

            last_upload_time = current_time

    except Exception as e:
        print("Gateway error:", e)