import requests
import threading
from backend.gateway.config import FIREBASE_URL


def upload_data(data):
    """Upload filtered ECG chunk data to Firebase Realtime Database (blocking)."""

    url = FIREBASE_URL + "/patient_01/live_stream.json"

    try:
        # Use PUT (not POST) so frontend always reads the LATEST data, not appending
        response = requests.put(url, json=data, timeout=5)

        if response.status_code == 200:
            print(f"Firebase OK | BPM: {data.get('bpm', '?')} | Status: {data.get('status', '?')} | Chunk size: {len(data.get('ecg_chunk', []))}")

        else:
            print("Firebase error:", response.status_code)

    except requests.exceptions.RequestException as e:
        print("Firebase connection error:", e)


def upload_data_async(data):
    """Non-blocking wrapper — runs upload_data in a background thread."""
    t = threading.Thread(target=upload_data, args=(data,), daemon=True)
    t.start()