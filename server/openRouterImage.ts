import { z } from "zod";

import { requireOpenRouterApiKey } from "./config";

// Model slug and image-editing capability:
// https://openrouter.ai/google/gemini-2.5-flash-image
export const OPENROUTER_IMAGE_MODEL = "google/gemini-2.5-flash-image";
const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";
const MAX_BASE64_LENGTH = 14 * 1024 * 1024;
const SOURCE_IMAGE_PATTERN = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

interface OpenRouterImageParams {
  imageUrl: string;
  prompt: string;
}

interface OpenRouterImageOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export interface ImageEditResult {
  imageData: string;
  mimeType: string;
}

const openRouterResponseSchema = z.object({
  data: z.array(z.object({
    b64_json: z.string().min(1).max(MAX_BASE64_LENGTH),
    media_type: z.enum(["image/jpeg", "image/png", "image/webp"]).optional(),
  })).min(1),
});

function validateSourceImage(imageUrl: string): void {
  const match = SOURCE_IMAGE_PATTERN.exec(imageUrl);
  if (!match || match[2].length > MAX_BASE64_LENGTH) {
    throw new Error("Invalid source image");
  }
}

function mapOpenRouterError(status: number): Error {
  if (status === 401) return new Error("INVALID_API_KEY: OpenRouter authentication failed");
  if (status === 402 || status === 429) {
    return new Error("QUOTA_EXCEEDED: OpenRouter credits or rate limit exceeded");
  }
  if (status === 403) return new Error("API_ACCESS_DENIED: OpenRouter denied image generation");
  if (status === 404) return new Error("MODEL_NOT_FOUND: Nano Banana is unavailable on OpenRouter");
  return new Error(`OPENROUTER_ERROR: Image generation failed with status ${status}`);
}

export async function editImageWithOpenRouter(
  params: OpenRouterImageParams,
  options: OpenRouterImageOptions = {},
): Promise<ImageEditResult> {
  validateSourceImage(params.imageUrl);
  const apiKey = options.apiKey ?? requireOpenRouterApiKey();
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(OPENROUTER_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // OpenRouter Image API reference-image contract:
        // https://openrouter.ai/docs/guides/overview/multimodal/image-generation#image-to-image-reference-images
        model: OPENROUTER_IMAGE_MODEL,
        prompt: params.prompt,
        n: 1,
        input_references: [{
          type: "image_url",
          image_url: { url: params.imageUrl },
        }],
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new Error("OPENROUTER_ERROR: OpenRouter could not be reached");
  }

  if (!response.ok) throw mapOpenRouterError(response.status);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("INVALID_RESPONSE: OpenRouter returned invalid JSON");
  }
  const parsed = openRouterResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("INVALID_RESPONSE: OpenRouter returned no valid image");
  }

  return {
    imageData: parsed.data.data[0].b64_json,
    mimeType: parsed.data.data[0].media_type ?? "image/png",
  };
}
