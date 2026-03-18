from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.api.routes import router as api_router
from app.core.config import settings
from app.services.serial_service import start_serial_reader
from app.services.pipeline import pipeline

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS enabled for the frontend visualization app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    print("Starting up background services...")
    start_serial_reader()
    pipeline.start()

@app.get("/")
def read_root():
    return {"message": "Welcome to the ECG IoT Gateway API"}
