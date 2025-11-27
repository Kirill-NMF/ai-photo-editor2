export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string; // base64 encoded image
  mimeType: string;
}

/**
 * Edit an image using Gemini 2.0 Flash Experimental model via REST API
 * Uses generativelanguage.googleapis.com (NOT Vertex AI)
 */
export async function editImageWithGemini(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    console.log("[Gemini] Starting image edit request...");
    
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
      console.log(`[Gemini] Parsed data URL. Mime type: ${mimeType}`);
    } else {
      // Fetch from URL
      console.log(`[Gemini] Fetching image from URL: ${request.imageUrl}`);
      const imageResponse = await fetch(request.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString("base64");
      mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
      console.log(`[Gemini] Image fetched and converted to base64. Mime type: ${mimeType}`);
    }

    // Use Gemini REST API (generativelanguage.googleapis.com)
    // Model: gemini-2.0-flash-exp (supports image generation)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
            {
              text: request.prompt,
            },
          ],
        },
      ],
      generationConfig: {
        response_modalities: ["IMAGE"],
      },
    };

    console.log("[Gemini] Sending request to Gemini API...");
    console.log(`[Gemini] Model: gemini-2.0-flash-exp`);
    console.log(`[Gemini] Prompt: ${request.prompt}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini] API error response:", errorText);
      
      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error("INVALID_API_KEY: Authentication failed. Check your Gemini API key.");
      } else if (response.status === 429) {
        throw new Error("QUOTA_EXCEEDED: You've reached your API usage limit.");
      } else if (response.status === 403) {
        throw new Error("API_ACCESS_DENIED: Access denied. Check API key permissions.");
      }
      
      throw new Error(`Gemini API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("[Gemini] Response received successfully");

    // Extract the generated image from response
    if (!data.candidates || data.candidates.length === 0) {
      console.error("[Gemini] No candidates in response:", JSON.stringify(data));
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      console.error("[Gemini] No content/parts in candidate:", JSON.stringify(candidate));
      throw new Error("No content in Gemini response");
    }

    // Find the image part (inline_data)
    const imagePart = candidate.content.parts.find((part: any) => part.inline_data);

    if (!imagePart || !imagePart.inline_data) {
      console.error("[Gemini] No image in response parts:", JSON.stringify(candidate.content.parts));
      throw new Error("No image data in response. Model may not support image generation.");
    }

    console.log("[Gemini] Image extracted successfully");

    return {
      imageData: imagePart.inline_data.data,
      mimeType: imagePart.inline_data.mime_type || "image/jpeg",
    };
  } catch (error: any) {
    console.error("[Gemini] Error:", error);
    
    // Re-throw known errors
    if (error.message.startsWith("INVALID_API_KEY:") || 
        error.message.startsWith("QUOTA_EXCEEDED:") ||
        error.message.startsWith("API_ACCESS_DENIED:")) {
      throw error;
    }
    
    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to edit image with Gemini: ${errorMessage}`);
  }
}
