from celery import Celery
import os
from dotenv import load_dotenv
from services.image_service import ImageProcessor

load_dotenv()

# Celery Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
celery_app = Celery("campanhaviva_workers", broker=REDIS_URL, backend=REDIS_URL)

@celery_app.task(name="process_image_task")
def process_image_task(user_image_bytes, frame_path, output_path):
    """
    Asynchronous task to process user image and apply frame.
    """
    processor = ImageProcessor()
    try:
        # Step 1: AI Auto-adjustment (Placeholder)
        user_image_bytes = processor.ai_auto_adjust(user_image_bytes)
        
        # Step 2: Apply Frame
        result_path = processor.apply_frame(user_image_bytes, frame_path, output_path)
        
        return {"status": "success", "output_path": result_path}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# To run the worker:
# celery -A workers.celery_app worker --loglevel=info
