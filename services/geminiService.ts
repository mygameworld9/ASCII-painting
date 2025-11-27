import { GoogleGenAI, Type } from "@google/genai";
import { AsciiSettings } from "../types";

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

export const tuneParticleSettings = async (prompt: string): Promise<Partial<AsciiSettings>> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing for tuning");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: `You are a visual effects parameter tuner for a particle system. 
            Translate the user's description into these numerical parameters:
            - animationSpeed (0.0 to 5.0): Speed of particle movement. High = storm/chaos, Low = drift/float.
            - animationIntensity (0.0 to 5.0): Amplitude of movement. High = large swings, Low = subtle vibration.
            - extractionThreshold (0 to 100): Edge detection sensitivity.
              * IMPORTANT: To "Isolate the Subject" or "Remove Background", set this HIGH (65-90). This hides the background and only shows the main character.
              * IMPORTANT: To "Restore" or "Show All", set this LOW (5-20). This reveals the full image texture and background.
            
            Return ONLY the JSON object.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    animationSpeed: { type: Type.NUMBER },
                    animationIntensity: { type: Type.NUMBER },
                    extractionThreshold: { type: Type.INTEGER }
                },
                required: ["animationSpeed", "animationIntensity", "extractionThreshold"]
            }
        }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    return {};
  } catch (error) {
      console.error("Tune Settings Error:", error);
      return {};
  }
};

export const generateMotionScript = async (prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing for script");
    return "";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a math animation expert.
        Generate a minimal JavaScript code snippet for the body of a function that returns the [x, y] offset for a particle.
        
        Available variables:
        - x: current column index
        - y: current row index
        - t: elapsed time in seconds
        - i: animation intensity (multiplier)
        - w: total width (columns)
        - h: total height (rows)

        Return ONLY the raw code for the function body. Do not include markdown blocks. Do not include the function signature.
        The code MUST end with 'return [dx, dy];' where dx and dy are numbers.
        
        Example outputs:
        "return [Math.sin(t + x*0.1) * i, 0];"
        "const r = Math.sin(t); return [r * i, -r * i];"
        
        Create interesting mathematical patterns based on the user's description.`,
      }
    });

    return response.text ? response.text.replace(/```javascript|```/g, '').trim() : "";
  } catch (error) {
    console.error("Script Gen Error:", error);
    return "";
  }
};