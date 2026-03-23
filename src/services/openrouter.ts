import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = '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'; // WARNING: Hardcoded for demo purposes. Use environment variables in production.
const SITE_URL = process.env.VITE_APP_URL || 'http://localhost:3000';
const SITE_NAME = 'CAMPANHAVIVA';

export const generateCampaignSlogan = async (candidateName: string, bio: string): Promise<string[]> => {
  if (!OPENROUTER_API_KEY) {
    console.error("OpenRouter API Key is missing.");
    return ["API key not configured"];
  }

  const headers = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`, // Using hardcoded key as requested
    'HTTP-Referer': SITE_URL,
    'X-Title': SITE_NAME,
    'Content-Type': 'application/json',
  };

  const prompt = `
    Você é um marqueteiro político sênior. 
    Crie 5 slogans de impacto para o candidato ${candidateName}.
    Bio do candidato: ${bio}
    
    Retorne no formato JSON:
    {
        "slogans": ["slogan 1", "slogan 2", "slogan 3", "slogan 4", "slogan 5"]
    }
    `;

  const data = {
    model: "google/gemini-2.0-flash-001",
    messages: [
      { "role": "user", "content": prompt }
    ],
    "response_format": { "type": "json_object" }
  };

  try {
    const response = await axios.post(OPENROUTER_API_URL, data, { headers });
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = JSON.parse(response.data.choices[0].message.content);
      return content.slogans || [];
    }
    return ["Invalid response format from API"];
  } catch (error: any) {
    console.error("Error calling OpenRouter API:", error.response?.data || error.message);
    return ["An unknown error occurred"];
  }
};

export const analyzeLayoutPerformance = async (layoutData: any) => {
  // Mocking AI analysis for now, but could be a real prompt
  return {
    score: 85,
    suggestions: ["Aumentar o contraste da logo", "Usar uma fonte mais legível para o nome"]
  };
};
