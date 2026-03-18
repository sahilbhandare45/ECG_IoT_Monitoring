from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ECG IoT Monitoring System"
    API_V1_STR: str = "/api/v1"
    
    # Serial Port Settings
    SERIAL_PORT: str = "COM3"  # Default testing port, overwrite with env var or correct port
    BAUD_RATE: int = 9600
    
    # Firebase Settings
    FIREBASE_URL: str = "https://ecg-iot-monitoring-default-rtdb.firebaseio.com/"
    FIREBASE_DATA_PATH: str = "/patient_01/live_stream.json"

    # System Constants
    SAMPLE_RATE: int = 200
    BUFFER_SECONDS: int = 10
    
    class Config:
        env_file = ".env"

settings = Settings()
