import Replicate from 'replicate';

export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

/**
 * Generate/edit an image using Replicate API with SDXL model
 * Requires REPLICATE_API_TOKEN in environment
 */
export async function editImageWithReplicate(
  request: ImageEditRequest
): Promise<ImageEditResult> {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    console.log("Generating image with Replicate SDXL:", { prompt: request.prompt });
    
    let output;
    
    if (request.imageUrl && request.imageUrl.startsWith("data:")) {
      // Image-to-image editing
      output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            image: request.imageUrl,
            prompt: request.prompt,
            refine: "expert_ensemble_refiner",
            scheduler: "K_EULER",
            lora_scale: 0.6,
            num_outputs: 1,
            guidance_scale: 7.5,
            apply_watermark: false,
            high_noise_frac: 0.8,
            negative_prompt: "",
            prompt_strength: 0.8,
            num_inference_steps: 25
          }
        }
      );
    } else {
      // Text-to-image generation
      output = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: request.prompt,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 25,
            apply_watermark: false,
          }
        }
      );
    }

    // Replicate returns an array of URLs
    const resultUrl = Array.isArray(output) ? output[0] : output;
    
    if (!resultUrl || typeof resultUrl !== 'string') {
      throw new Error('Invalid response from Replicate API');
    }
    
    // Download the image
    const response = await fetch(resultUrl);
    if (!response.ok) {
      throw new Error(`Failed to download generated image: ${response.statusText}`);
    }
    
    // Convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';
    
    return {
      imageData: base64,
      mimeType,
    };
  } catch (error: any) {
    console.error("Replicate API error:", error);
    throw new Error(`Failed to generate image with Replicate: ${error.message}`);
  }
}
