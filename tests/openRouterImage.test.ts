import assert from "node:assert/strict";
import test from "node:test";

import {
  editImageWithOpenRouter,
  OPENROUTER_IMAGE_MODEL,
} from "../server/openRouterImage";

test("OpenRouter image editing sends Nano Banana one private reference image", async () => {
  let request: Request | undefined;
  const result = await editImageWithOpenRouter(
    {
      imageUrl: "data:image/png;base64,aW1hZ2U=",
      prompt: "Make the sky warmer",
    },
    {
      apiKey: "test-key",
      fetchImpl: async (input, init) => {
        request = new Request(input, init);
        return Response.json({ data: [{ b64_json: "cmVzdWx0" }] });
      },
    },
  );

  assert.equal(OPENROUTER_IMAGE_MODEL, "google/gemini-2.5-flash-image");
  assert.equal(request?.url, "https://openrouter.ai/api/v1/images");
  assert.equal(request?.headers.get("authorization"), "Bearer test-key");
  assert.deepEqual(await request?.json(), {
    model: OPENROUTER_IMAGE_MODEL,
    prompt: "Make the sky warmer",
    n: 1,
    input_references: [{
      type: "image_url",
      image_url: { url: "data:image/png;base64,aW1hZ2U=" },
    }],
  });
  assert.deepEqual(result, { imageData: "cmVzdWx0", mimeType: "image/png" });
});

test("OpenRouter image editing rejects malformed external responses", async () => {
  await assert.rejects(
    editImageWithOpenRouter(
      { imageUrl: "data:image/jpeg;base64,aW1hZ2U=", prompt: "Edit" },
      {
        apiKey: "test-key",
        fetchImpl: async () => Response.json({ data: [] }),
      },
    ),
    /INVALID_RESPONSE/,
  );
});

test("OpenRouter image editing maps credit and authentication errors", async () => {
  for (const [status, expected] of [[402, "QUOTA_EXCEEDED"], [401, "INVALID_API_KEY"]] as const) {
    await assert.rejects(
      editImageWithOpenRouter(
        { imageUrl: "data:image/webp;base64,aW1hZ2U=", prompt: "Edit" },
        {
          apiKey: "test-key",
          fetchImpl: async () => Response.json({ error: { message: "external detail" } }, { status }),
        },
      ),
      new RegExp(expected),
    );
  }
});

test("OpenRouter image editing accepts only private raster data URLs", async () => {
  await assert.rejects(
    editImageWithOpenRouter(
      { imageUrl: "https://example.com/image.png", prompt: "Edit" },
      { apiKey: "test-key", fetchImpl: async () => Response.json({}) },
    ),
    /Invalid source image/,
  );
});

test("OpenRouter image editing does not expose network error details", async () => {
  await assert.rejects(
    editImageWithOpenRouter(
      { imageUrl: "data:image/png;base64,aW1hZ2U=", prompt: "Edit" },
      {
        apiKey: "test-key",
        fetchImpl: async () => {
          throw new Error("sensitive proxy hostname and port");
        },
      },
    ),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /OPENROUTER_ERROR/);
      assert.equal(error.message.includes("sensitive proxy"), false);
      return true;
    },
  );
});
