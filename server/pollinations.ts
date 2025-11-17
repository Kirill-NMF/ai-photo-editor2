export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

/**
 * Generate an image using Pollinations AI (free, no API key required)
 * Note: Pollinations doesn't support direct image-to-image editing.
 * This function generates a new image based on the prompt.
 */
export async function editImageWithPollinations(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  try {
    const encodedPrompt = encodeURIComponent(request.prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    
    console.log("Generating image with Pollinations:", { prompt: request.prompt });
    
    // Fetch the generated image
    const response = await fetch(pollinationsUrl);
    if (!response.ok) {
      throw new Error(`Pollinations API error: ${response.statusText}`);
    }
    
    // Convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      imageData: base64,
      mimeType,
    };
  } catch (error: any) {
    console.error("Pollinations API error:", error);
    throw new Error(`Failed to generate image with Pollinations: ${error.message}`);
  }
}
