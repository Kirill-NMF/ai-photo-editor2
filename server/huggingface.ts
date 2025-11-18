import { HfInference } from "@huggingface/inference";

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
 * Uses Qwen/Qwen-Image-Edit model - specialized for instruction-based editing
 * Popular, open license, not gated - works for all users
 */
export async function editImageWithHuggingFace(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  try {
    if (!request.imageUrl) {
      throw new Error("Input image is required for Hugging Face image-to-image editing");
    }

    console.log("Generating image with Hugging Face (Qwen/Qwen-Image-Edit):", { prompt: request.prompt });

    let imageBlob: Blob;

    // Convert data URL to Blob
    if (request.imageUrl.startsWith("data:")) {
      const matches = request.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error("Invalid data URL format");
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      imageBlob = new Blob([buffer], { type: mimeType });
    } else {
      // Fetch from URL
      const response = await fetch(request.imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${request.imageUrl}`);
      }
      imageBlob = await response.blob();
    }

    // Call the Hugging Face API with the Qwen/Qwen-Image-Edit model
    const resultBlob = await hf.imageToImage({
      model: "Qwen/Qwen-Image-Edit",
      inputs: imageBlob,
      parameters: {
        prompt: request.prompt,
      },
    });

    // Convert the result blob to base64
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = resultBlob.type || "image/jpeg";

    console.log("Successfully received edited image from Hugging Face");
    
    return {
      imageData: base64,
      mimeType,
    };
  } catch (error: any) {
    console.error("Hugging Face API error:", error);
    throw new Error(`Failed to edit image with Hugging Face: ${error.message}`);
  }
}
