import requests
from backend.gateway.config import FIREBASE_URL


def upload_data(data):

    url = FIREBASE_URL + "/patient_01.json"

    try:
        response = requests.post(url, json=data, timeout=5)

        if response.status_code == 200:
            print("Firebase upload OK")

        else:
            print("Firebase error:", response.status_code)

    except requests.exceptions.RequestException as e:
        print("Firebase connection error:", e)