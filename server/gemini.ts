const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = 'us-central1';
const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
const model = 'gemini-2.5-flash-image';

interface GeminiParams {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  console.log(`[Gemini REST] Fetching image from URL: ${url}`);
  
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

  console.log(`[Gemini REST] Image converted to base64. Mime type: ${mimeType}`);
  return { base64: base64Data, mimeType };
}

export async function editImageWithGemini({ imageUrl, prompt }: GeminiParams): Promise<ImageEditResult> {
  console.log("[Gemini REST] Starting image edit with Vertex AI REST API...");
  console.log(`[Gemini REST] Using model: ${model}`);
  console.log(`[Gemini REST] Project: ${project}`);
  console.log(`[Gemini REST] Location: ${location}`);
  
  if (!project || !apiKey) {
    throw new Error('GOOGLE_CLOUD_PROJECT or GOOGLE_CLOUD_API_KEY is not set');
  }

  try {
    const { base64, mimeType } = await urlToBase64(imageUrl);

    // Формируем URL для Vertex AI REST API
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          { 
            inlineData: { 
              mimeType, 
              data: base64 
            } 
          },
          { text: prompt }
        ]
      }]
    };

    console.log('[Gemini REST] Sending request to Vertex AI...');
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[Gemini REST] API error response:', errorText);
      throw new Error(`Vertex AI API request failed with status ${apiResponse.status}: ${errorText}`);
    }

    const result = await apiResponse.json() as any;
    console.log('[Gemini REST] Response received, extracting image...');

    // Извлекаем результат
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('No candidates returned from Vertex AI');
    }

    const parts = result.candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error('No parts in response');
    }

    const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart || !imagePart.inlineData) {
      console.error('[Gemini REST] Response parts:', JSON.stringify(parts, null, 2));
      throw new Error('Vertex AI did not return an image. The model may not support image generation.');
    }

    const { data, mimeType: responseMimeType } = imagePart.inlineData;
    console.log(`[Gemini REST] Image generated successfully! Mime type: ${responseMimeType}`);

    return {
      imageData: data || "",
      mimeType: responseMimeType || "image/png",
    };

  } catch (error: any) {
    console.error('[Gemini REST] API call failed:', error);
    
    if (error?.message?.includes("quota") || error?.message?.includes("429")) {
      throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit.");
    }
    
    if (error?.message?.includes("401") || error?.message?.includes("unauthorized")) {
      throw new Error("INVALID_CREDENTIALS: Authentication failed. Check your API key.");
    }
    
    if (error?.message?.includes("403") || error?.message?.includes("forbidden")) {
      throw new Error("API_ACCESS_DENIED: Access denied. Ensure Vertex AI API is enabled.");
    }

    if (error?.message?.includes("404")) {
      throw new Error("MODEL_NOT_FOUND: The specified model was not found. Check the model name and region.");
    }
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Vertex AI REST API Error: ${errorMessage}`);
  }
}
