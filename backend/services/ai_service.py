import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

class AIService:
    @staticmethod
    def generate_slogan(campaign_name: str, target_audience: str):
        """
        Generates a creative slogan for a campaign using OpenRouter (Gemini 2.0 Flash).
        """
        # Hardcoded for demo purposes as requested. Use environment variables in production.
        api_key = "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"
        if not api_key:
            return "Slogan generation failed: API key missing"
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        prompt = f"Crie um slogan curto e impactante para uma campanha chamada '{campaign_name}' voltada para o público '{target_audience}'. Responda apenas com o slogan."
        
        data = {
            "model": "google/gemini-2.0-flash-exp:free",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                data=json.dumps(data)
            )
            
            if response.status_code == 200:
                result = response.json()
                slogan = result['choices'][0]['message']['content'].strip()
                return slogan
            else:
                return f"AI Error: {response.status_code} - {response.text}"
        except Exception as e:
            return f"AI Service Exception: {str(e)}"

    @staticmethod
    def suggest_design_elements(campaign_theme: str):
        """
        Suggests colors and design styles for a campaign theme.
        """
        # Placeholder for design AI logic
        return {"colors": ["#FF0000", "#FFFFFF"], "style": "Modern Brutalist"}
