import os
import requests
from dotenv import load_dotenv

load_dotenv()

class TelegramBot:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.base_url = f"https://api.telegram.org/bot{self.token}"

    def send_message(self, chat_id: str, text: str):
        """
        Sends a message to a Telegram chat.
        """
        url = f"{self.base_url}/sendMessage"
        payload = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
        response = requests.post(url, json=payload)
        return response.json()

    def send_photo(self, chat_id: str, photo_path: str, caption: str = ""):
        """
        Sends a processed photo to a Telegram chat.
        """
        url = f"{self.base_url}/sendPhoto"
        with open(photo_path, "rb") as photo:
            files = {"photo": photo}
            payload = {"chat_id": chat_id, "caption": caption}
            response = requests.post(url, files=files, data=payload)
        return response.json()

# To run the bot listener (webhook or polling):
# python bot/telegram/bot_service.py
