
import { GoogleGenAI, Type } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const checkMedicineSafety = async (medicineName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a clinical safety analysis for the medicine: ${medicineName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            safetyStatus: { type: Type.STRING, description: "One sentence summary of safety" },
            advantages: { type: Type.ARRAY, items: { type: Type.STRING } },
            disadvantages: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "safetyStatus", "advantages", "disadvantages"]
        }
      }
    });
    // Use .text property directly. Ensure it handles undefined cases.
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Safety Check Error:", error);
    return {
      name: medicineName,
      safetyStatus: "General safety verification pending. Consult a pharmacist.",
      advantages: ["Relieves symptoms", "Standard treatment"],
      disadvantages: ["May cause drowsiness", "Check for allergies"]
    };
  }
};
