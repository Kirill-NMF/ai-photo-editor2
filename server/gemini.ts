import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string; // base64 encoded image
  mimeType: string;
}

/**
 * Edit an image using Gemini 2.0 Flash Image Generation model
 * Uses generateContent with multimodal approach 1
 */
export async function editImageWithGemini(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  try {
    // Parse data URL to get image data and mime type
    let imageBase64: string;
    let mimeType: string;

    if (request.imageUrl.startsWith("data:")) {
      // Parse data URL
      const matches = request.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid data URL format");
      }
      mimeType = matches[1];
      imageBase64 = matches[2];
    } else {
      // Fetch from URL
      const imageResponse = await fetch(request.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString("base64");
      mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    }

    // Use generateContent with multimodal input
    // Model requires BOTH IMAGE and TEXT response modalities
    const response = await genAI.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
            {
              text: `Edit this image based on the following instruction: ${request.prompt}`,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // Extract the generated image from response
    // The model returns both text and image parts
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
    }

    const content = candidates[0].content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parts = content.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No parts in response");
    }

    // Find the part with inline image data (not the text part)
    const imagePart = parts.find((part: any) => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image data in response. Response contained only text.");
    }

    return {
      imageData: imagePart.inlineData.data || "",
      mimeType: imagePart.inlineData.mimeType || "image/jpeg",
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    // Handle specific error types
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit. Please try again later or check your API quota at https://ai.dev/usage");
    }
    
    if (error?.message?.includes("401") || error?.message?.includes("unauthorized")) {
      throw new Error("INVALID_API_KEY: Your API key is invalid or expired. Please check your Gemini API key configuration.");
    }
    
    if (error?.message?.includes("403") || error?.message?.includes("forbidden")) {
      throw new Error("API_ACCESS_DENIED: Access denied. Please ensure your API key has the correct permissions.");
    }
    
    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to edit image with Gemini: ${errorMessage}`);
  }
}
