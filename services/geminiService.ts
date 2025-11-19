import { GoogleGenAI } from "@google/genai";

export const generateAIImage = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Using imagen-4.0-generate-001 for high quality image generation
    // as per guidelines for "High-Quality Image Generation Tasks"
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1', 
      },
    });

    const generatedImage = response.generatedImages?.[0]?.image;
    
    if (!generatedImage || !generatedImage.imageBytes) {
      throw new Error("No image data returned from API");
    }

    return `data:image/jpeg;base64,${generatedImage.imageBytes}`;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

export const generateCreativePrompt = async (): Promise<string> => {
    if (!process.env.API_KEY) {
        return "A futuristic cyberpunk city with neon lights"; // Fallback
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a single, short, descriptive creative prompt (under 20 words) for an image that would look cool as ASCII art. Just the prompt, no quotes.",
        });
        return response.text || "A skull made of smoke and glitch art";
    } catch (e) {
        return "A retro synthesizer floating in space";
    }
}