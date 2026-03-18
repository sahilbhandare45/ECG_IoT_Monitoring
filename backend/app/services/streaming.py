import requests
import json
import threading
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
from app.core.config import settings

class StreamingService:
    def __init__(self):
        self.session = requests.Session()
        retries = Retry(total=3, backoff_factor=0.1)
        self.session.mount('https://', HTTPAdapter(max_retries=retries))
        self.url = f"{settings.FIREBASE_URL}{settings.FIREBASE_DATA_PATH}"
        
    def stream_batch(self, batch_payload: dict):
        """
        Sends a batch of ECG streaming data to Firebase using a background thread
        so it doesn't block the Pan-Tompkins algorithm if the network lags.
        """
        if settings.FIREBASE_URL == "https://ecg-iot-monitoring-default-rtdb.firebaseio.com":
            return # Skip if user hasn't configured Firebase yet
            
        def _upload():
            try:
                # We use PUT or PATCH to maintain a small rolling payload window
                # Without causing database explosion
                response = self.session.put(self.url, json=batch_payload, timeout=2.0)
                if response.status_code not in (200, 201, 204):
                    print(f"Firebase Upload Error: {response.text}")
            except Exception as e:
                print(f"Network error in streaming: {e}")
                
        threading.Thread(target=_upload, daemon=True).start()

streaming_service = StreamingService()
