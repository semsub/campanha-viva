from PIL import Image
import io
import os

class ImageProcessor:
    @staticmethod
    def apply_frame(user_image_bytes, frame_path, output_path):
        """
        Applies a frame (twibbon) to a user's image.
        :param user_image_bytes: Bytes of the user's uploaded image.
        :param frame_path: Path to the campaign frame (PNG with transparency).
        :param output_path: Path to save the final image.
        """
        # Load user image from bytes
        user_img = Image.open(io.BytesIO(user_image_bytes)).convert("RGBA")
        
        # Load frame image
        if not os.path.exists(frame_path):
            raise FileNotFoundError(f"Frame not found at {frame_path}")
        
        frame_img = Image.open(frame_path).convert("RGBA")
        
        # Resize frame to match user image dimensions or vice versa
        # Standardize to 1080x1080 for high quality
        target_size = (1080, 1080)
        user_img = user_img.resize(target_size, Image.Resampling.LANCZOS)
        frame_img = frame_img.resize(target_size, Image.Resampling.LANCZOS)
        
        # Composite images: user image is the base, frame is the top layer
        final_img = Image.alpha_composite(user_img, frame_img)
        
        # Save output
        final_img.save(output_path, "PNG")
        return output_path

    @staticmethod
    def ai_auto_adjust(user_image_bytes):
        """
        Simulates AI auto-adjustment (brightness, contrast, cropping).
        In a real scenario, this would use OpenCV or a pre-trained model.
        """
        # Placeholder for AI logic
        return user_image_bytes
