
import { GoogleGenAI, Modality } from "@google/genai";
import { LANGUAGES } from '../constants';

// FIX: Per @google/genai coding guidelines, the API key must be obtained from process.env.API_KEY.
// This also resolves the TypeScript error regarding 'import.meta.env'.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This provides a clear, immediate error if the environment variable is missing.
  throw new Error("API_KEY environment variable not set. Please add it to your Vercel project settings and redeploy.");
}

// Initialize the AI client once and reuse it for all API calls for better performance.
const ai = new GoogleGenAI({ apiKey: API_KEY });

const getLanguageFullName = (code: string): string => {
  const lang = LANGUAGES.find(l => l.value === code);
  return lang ? lang.fullName : 'the specified language';
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  const sourceLangFullName = getLanguageFullName(sourceLang);
  const targetLangFullName = getLanguageFullName(targetLang);

  const prompt = `Translate the following text from ${sourceLangFullName} to ${targetLangFullName}. Provide ONLY the translated text, without any additional explanations or introductions.

Text to translate:
"${text}"
`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error translating text:", error);
    if (error instanceof Error && error.message) {
      throw new Error(`Translation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during translation. Please check the console for details.");
  }
};

export const getPronunciation = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              // A versatile voice that works well for multiple languages
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from API. The content may have been blocked.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error getting pronunciation:", error);
    if (error instanceof Error && error.message) {
      throw new Error(`Audio generation failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred during audio generation. Please check the console for details.");
  }
};
