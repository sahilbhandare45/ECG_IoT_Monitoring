import joblib

model = joblib.load("ecg_model.pkl")

def predict(features):

    result = model.predict([features])

    if result[0] == 1:
        return "ALERT"

    return "NORMAL"