from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from image_processor import process_supporter_image

# Load environment variables
load_dotenv()

app = FastAPI(title="CampanhaViva SaaS API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ImageProcessRequest(BaseModel):
    user_image: str
    layout_image: str
    tenant_id: str

@app.get("/")
async def root():
    return {"status": "online", "system": "CampanhaViva SaaS", "engine": "FastAPI"}

@app.post("/api/process-image")
async def process_image(request: ImageProcessRequest):
    try:
        processed_image = process_supporter_image(request.user_image, request.layout_image)
        return {"processed_image": processed_image, "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
