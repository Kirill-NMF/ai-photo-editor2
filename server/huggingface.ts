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
 * Uses the nvidia/ChronoEdit-14B-Diffusers model via the fal-ai provider
 * Requires HUGGINGFACE_API_KEY in environment
 */
export async function editImageWithHuggingFace(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  try {
    if (!request.imageUrl) {
      throw new Error("Input image is required for Hugging Face image-to-image editing");
    }

    console.log("Generating image with Hugging Face (ChronoEdit):", { prompt: request.prompt });

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

    // Call the image-to-image API using the correct model and provider
    // Using 'as any' because provider parameter is supported by the API but not yet in type definitions
    const resultBlob = await hf.imageToImage(
      {
        model: "nvidia/ChronoEdit-14B-Diffusers",
        inputs: imageBlob,
        parameters: {
          prompt: request.prompt,
        },
      },
      {
        provider: "fal-ai",
      } as any
    );

    // Convert the result blob to base64
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = resultBlob.type || "image/jpeg";

    return {
      imageData: base64,
      mimeType,
    };
  } catch (error: any) {
    console.error("Hugging Face API error:", error);
    throw new Error(`Failed to edit image with Hugging Face: ${error.message}`);
  }
}
