import { GoogleGenAI, Modality } from "@google/genai";
import { LanguageOption } from '../types';
import { LANGUAGES } from '../constants';

const getLanguageFullName = (code: string): string => {
  const lang = LANGUAGES.find(l => l.value === code);
  return lang ? lang.fullName : 'the specified language';
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    throw new Error("Failed to get a translation from the AI. Please try again.");
  }
};

export const getPronunciation = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      throw new Error("No audio data received from API.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("Error getting pronunciation:", error);
    throw new Error("Failed to generate audio. Please try again.");
  }
};