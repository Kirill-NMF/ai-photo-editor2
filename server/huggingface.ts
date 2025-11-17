import fetch from 'node-fetch';

// The full, direct URL to the specific model and provider endpoint
const API_URL = 'https://api-inference.huggingface.co/models/nvidia/ChronoEdit-14B-Diffusers/fal-ai/chrono-edit';

export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

/**
 * Edit an image using Hugging Face Inference API (free tier)
 * Uses direct fetch to avoid unauthenticated SDK discovery requests
 * Supports both data URLs (base64) and public URLs
 */
export async function editImageWithHuggingFace(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  try {
    if (!request.imageUrl) {
      throw new Error("Input image is required for Hugging Face image-to-image editing");
    }

    console.log("Generating image with Hugging Face (ChronoEdit) via direct API:", { prompt: request.prompt });

    let imageBase64: string;
    let sourceMimeType: string;

    // Handle data URL (base64)
    if (request.imageUrl.startsWith("data:")) {
      const matches = request.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid data URL format");
      }
      sourceMimeType = matches[1];
      imageBase64 = matches[2];
    } else {
      // Fetch from public URL and convert to base64
      const response = await fetch(request.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${request.imageUrl}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString("base64");
      sourceMimeType = response.headers.get("content-type") || "image/jpeg";
    }

    // Make direct authenticated API call
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          prompt: request.prompt,
          image: imageBase64,
        },
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error(`Hugging Face API responded with status ${apiResponse.status}:`, errorBody);
      throw new Error(`API request failed with status ${apiResponse.status}: ${errorBody}`);
    }

    const result = await apiResponse.json() as any;

    // Handle response - can be image_url or base64 image
    if (result && result.image_url) {
      // If API returns a URL, fetch it and convert to base64
      const imageResponse = await fetch(result.image_url);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch result image from URL: ${result.image_url}`);
      }
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);
      const resultBase64 = imageBuffer.toString("base64");
      const resultMimeType = imageResponse.headers.get("content-type") || "image/jpeg";

      console.log('Successfully received edited image from Hugging Face.');
      return {
        imageData: resultBase64,
        mimeType: resultMimeType,
      };
    } else if (result && result.image) {
      // If API returns base64 directly
      return {
        imageData: result.image,
        mimeType: sourceMimeType,
      };
    } else if (result && result.error) {
      console.error('Hugging Face API returned an error:', result.error);
      throw new Error(`Hugging Face API error: ${result.error}`);
    } else {
      console.error('Unexpected response format from Hugging Face:', result);
      throw new Error('Unexpected response format from Hugging Face API.');
    }
  } catch (error: any) {
    console.error('Error in editImageWithHuggingFace:', error);
    throw new Error(`Failed to edit image with Hugging Face: ${error.message}`);
  }
}
