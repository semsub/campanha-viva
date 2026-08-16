import cv2
import numpy as np
from PIL import Image
import io
import base64

def process_supporter_image(user_image_base64, layout_image_base64):
    """
    Processes the supporter image by merging it with the layout.
    This is a backend implementation using OpenCV/Pillow as requested.
    """
    # Decode images
    user_data = base64.b64decode(user_image_base64.split(',')[1])
    layout_data = base64.b64decode(layout_image_base64.split(',')[1])
    
    user_img = Image.open(io.BytesIO(user_data)).convert("RGBA")
    layout_img = Image.open(io.BytesIO(layout_data)).convert("RGBA")
    
    # Resize user image to match layout
    user_img = user_img.resize(layout_img.size, Image.Resampling.LANCZOS)
    
    # Merge images (user image behind layout)
    final_img = Image.alpha_composite(user_img, layout_img)
    
    # Convert back to base64
    buffered = io.BytesIO()
    final_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"
