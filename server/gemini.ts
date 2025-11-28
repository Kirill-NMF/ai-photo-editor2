import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Google AI Studio client
const ai = new GoogleGenAI({
  apiKey: apiKey
});

interface GeminiParams {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

/**
 * Convert image URL to base64
 */
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  console.log(`[Gemini] Fetching image from URL: ${url}`);
  
  let base64Data: string;
  let mimeType: string;

  if (url.startsWith("data:")) {
    // Handle data URL
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid data URL format");
    }
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    // Fetch from HTTP URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    mimeType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Data = buffer.toString("base64");
  }

  console.log(`[Gemini] Image converted to base64, mimeType: ${mimeType}`);
  return { base64: base64Data, mimeType };
}

/**
 * Edit image using Gemini 2.5 Flash Image model
 */
export async function editImageWithGemini(params: GeminiParams): Promise<ImageEditResult> {
  const { imageUrl, prompt } = params;

  console.log('[Gemini] Starting image edit request');
  console.log('[Gemini] Prompt:', prompt);

  try {
    // Convert image to base64
    const { base64, mimeType } = await urlToBase64(imageUrl);

    // Prepare the prompt with image
    // IMPORTANT: This is the correct format for gemini-2.5-flash-image
    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64,
        },
      },
    ];

    console.log('[Gemini] Sending request to Gemini API...');

    // Make API request
    // CRITICAL: Do NOT use responseModalities for gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: contents,
    });

    console.log('[Gemini] Response received');

    // Extract image from response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // Check for text response
          if (part.text) {
            console.log('[Gemini] Text response:', part.text);
          }
          
          // Check for image response
          if (part.inlineData && part.inlineData.data) {
            console.log('[Gemini] Image data found in response');
            
            const imageData = part.inlineData.data;
            const responseMimeType = part.inlineData.mimeType || "image/png";
            
            return {
              imageData: imageData,
              mimeType: responseMimeType,
            };
          }
        }
      }
    }

    throw new Error('No image data found in Gemini API response');

  } catch (error: any) {
    console.error('[Gemini] Error:', error.message);
    
    // Handle specific error cases
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit. Please try again later.");
    }
    
    if (error?.message?.includes("401") || error?.message?.includes("unauthorized")) {
      throw new Error("INVALID_API_KEY: Authentication failed. Check your GEMINI_API_KEY in Secrets.");
    }
    
    if (error?.message?.includes("403") || error?.message?.includes("forbidden")) {
      throw new Error("API_ACCESS_DENIED: Access denied. Verify your API key has image generation permissions.");
    }

    if (error?.message?.includes("404")) {
      throw new Error("MODEL_NOT_FOUND: The gemini-2.5-flash-image model was not found. Check if it's available in your region.");
    }

    if (error?.message?.includes("400") && error?.message?.includes("modalities")) {
      throw new Error("INVALID_REQUEST: The model configuration is incorrect. This error should not occur with the fixed code.");
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }
}
