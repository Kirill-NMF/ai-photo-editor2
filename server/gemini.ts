import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'us-central1';
const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI {
  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT is not set in environment variables');
  }
  
  if (!vertexAI) {
    vertexAI = new VertexAI({ 
      project: project, 
      location,
      googleAuthOptions: apiKey ? { apiKey } : undefined
    });
  }
  return vertexAI;
}

const MODEL_NAME = 'gemini-2.0-flash-exp';

interface GeminiParams {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  console.log(`[Gemini] Fetching image from URL: ${url}`);
  
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
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    mimeType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();
    base64Data = Buffer.from(buffer).toString("base64");
  }

  console.log(`[Gemini] Image converted to base64. Mime type: ${mimeType}`);
  return { base64: base64Data, mimeType };
}

export async function editImageWithGemini({ imageUrl, prompt }: GeminiParams): Promise<ImageEditResult> {
  console.log("[Gemini] Starting image edit with Vertex AI...");
  console.log(`[Gemini] Using model: ${MODEL_NAME}`);
  console.log(`[Gemini] Project: ${project}`);
  console.log(`[Gemini] Location: ${location}`);

  try {
    const ai = getVertexAI();
    const generativeModel = ai.getGenerativeModel({ model: MODEL_NAME });

    const { base64, mimeType } = await urlToBase64(imageUrl);

    const request = {
      contents: [{
        role: 'user' as const,
        parts: [
          { 
            inlineData: { 
              mimeType, 
              data: base64 
            } 
          },
          { text: `Edit this image based on the following instruction: ${prompt}` }
        ]
      }]
    };

    console.log('[Gemini] Sending request to Vertex AI...');
    const result = await generativeModel.generateContent(request);
    
    const contentResponse = result.response;
    if (!contentResponse || !contentResponse.candidates || contentResponse.candidates.length === 0) {
      throw new Error('No candidates returned from Vertex AI');
    }

    console.log('[Gemini] Response received, extracting image...');
    
    const parts = contentResponse.candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error('No parts in response');
    }

    const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart || !imagePart.inlineData) {
      console.error('[Gemini] Response parts:', JSON.stringify(parts, null, 2));
      throw new Error('Vertex AI did not return an image. The model may not support image generation.');
    }

    const { data, mimeType: responseMimeType } = imagePart.inlineData;
    console.log(`[Gemini] Image generated successfully! Mime type: ${responseMimeType}`);

    return {
      imageData: data || "",
      mimeType: responseMimeType || "image/png",
    };

  } catch (error: any) {
    console.error('[Gemini] API call failed:', error);
    
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit. Please try again later.");
    }
    
    if (error?.message?.includes("401") || error?.message?.includes("unauthorized") || error?.message?.includes("UNAUTHENTICATED")) {
      throw new Error("INVALID_CREDENTIALS: Authentication failed. Please check your Google Cloud credentials.");
    }
    
    if (error?.message?.includes("403") || error?.message?.includes("forbidden") || error?.message?.includes("PERMISSION_DENIED")) {
      throw new Error("API_ACCESS_DENIED: Access denied. Please ensure Vertex AI API is enabled in your Google Cloud project.");
    }

    if (error?.message?.includes("text output") || error?.message?.includes("INVALID_ARGUMENT")) {
      throw new Error("MODEL_NOT_SUPPORTED: This model doesn't support image generation in your configuration.");
    }

    if (error?.message?.includes("Could not load the default credentials")) {
      throw new Error("CREDENTIALS_NOT_FOUND: Google Cloud credentials not configured. Set GOOGLE_CLOUD_API_KEY or configure default credentials.");
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Vertex AI Error: ${errorMessage}`);
  }
}
