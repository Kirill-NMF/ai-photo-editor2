import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeminiParams {
  imageUrl: string;
  prompt: string;
}

interface InlinePart {
  inlineData: {
    data: string;
    mimeType: string;
  };
}

interface TextPart {
  text: string;
}

type Part = InlinePart | TextPart;

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

async function urlToGenerativePart(url: string): Promise<InlinePart> {
  console.log(`Fetching image from URL: ${url}`);
  
  let base64Data: string;
  let mimeType: string;

  if (url.startsWith("data:")) {
    const matches = url.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid data URL format");
    }
    mimeType = matches[1];
    base64Data = matches[2];
  } else {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL. Status: ${response.status}`);
    }

    mimeType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();
    base64Data = Buffer.from(buffer).toString("base64");
  }

  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };
}

export async function editImageWithGemini({ imageUrl, prompt }: GeminiParams): Promise<ImageEditResult> {
  console.log("Attempting to edit image with Gemini API...");
  console.log("Using model: gemini-2.0-flash-exp");

  try {
    const imagePart = await urlToGenerativePart(imageUrl);

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            imagePart,
            { text: `Edit this image based on the following instruction: ${prompt}` },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    console.log("Successfully received response from Gemini.");

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

    const imagePartFromResponse = parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePartFromResponse || !imagePartFromResponse.inlineData) {
      console.error("Response parts:", JSON.stringify(parts, null, 2));
      throw new Error("Gemini did not return an image in the response. The model may not support image generation in your region.");
    }

    const { data, mimeType } = imagePartFromResponse.inlineData;
    
    return {
      imageData: data || "",
      mimeType: mimeType || "image/png",
    };

  } catch (error: any) {
    console.error("Gemini API error:", error);
    
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit. Please try again later.");
    }
    
    if (error?.message?.includes("401") || error?.message?.includes("unauthorized")) {
      throw new Error("INVALID_API_KEY: Your API key is invalid or expired.");
    }
    
    if (error?.message?.includes("403") || error?.message?.includes("forbidden")) {
      throw new Error("API_ACCESS_DENIED: Access denied. Please ensure your API key has the correct permissions.");
    }

    if (error?.message?.includes("text output") || error?.message?.includes("INVALID_ARGUMENT")) {
      throw new Error("MODEL_NOT_SUPPORTED: This model doesn't support image generation. Image generation may not be available in your region.");
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Gemini API Error: ${errorMessage}`);
  }
}
