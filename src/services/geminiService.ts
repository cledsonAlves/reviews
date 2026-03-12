import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface AnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
}

export async function analyzeReview(content: string): Promise<AnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following app review and provide the sentiment (positive, neutral, or negative) and a very short summary (max 10 words) in Portuguese.
      
      Review: "${content}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              enum: ["positive", "neutral", "negative"],
              description: "The sentiment of the review."
            },
            summary: {
              type: Type.STRING,
              description: "A short summary of the review in Portuguese."
            }
          },
          required: ["sentiment", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      sentiment: result.sentiment || 'neutral',
      summary: result.summary || 'Sem resumo disponível.'
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'neutral',
      summary: 'Erro na análise.'
    };
  }
}
