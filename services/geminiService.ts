import { GoogleGenAI, Type } from "@google/genai";
import { SentimentResult } from '../types';

// Initialize the client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const SENTIMENT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isAggressive: { type: Type.BOOLEAN, description: "True if the text contains hostility, passive-aggressiveness, sarcasm, or toxicity." },
    reason: { type: Type.STRING, description: "A short explanation in Hebrew of why it was flagged." },
    suggestedRewrite: { type: Type.STRING, description: "A neutral, professional rewriting of the message in Hebrew, keeping only the facts." }
  },
  required: ["isAggressive", "reason", "suggestedRewrite"]
};

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  if (!apiKey) {
    console.warn("No API Key provided. Mocking response.");
    return { isAggressive: false, reason: "שירות לא זמין", suggestedRewrite: text };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a professional co-parenting mediator fluent in Hebrew. 
      Analyze the following Hebrew message from a divorced parent.
      Determine if it is aggressive, hostile, or emotionally charged.
      If it is, rewrite it to be purely factual, polite, and effective (removing "Why" questions, accusations, and emotional outbursts).
      
      Input Message: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SENTIMENT_SCHEMA,
        systemInstruction: "תפקידך להפחית חיכוכים בין הורים גרושים. את/ה אובייקטיבי/ת לחלוטין. בעת זיהוי טקסט תוקפני, הצע ניסוח ענייני ומכב ד, בעברית תקנית אך טבעית."
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as SentimentResult;
    }
    
    throw new Error("Empty response from AI");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      isAggressive: false,
      reason: "שגיאה בניתוח",
      suggestedRewrite: text
    };
  }
};