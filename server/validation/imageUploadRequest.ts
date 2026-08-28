import { z } from "zod";

export const imageUploadRequestSchema = z.object({
  uploadUrl: z.string().url().max(8_192),
  fileName: z.string().trim().min(1).max(255),
  fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  width: z.number().int().positive().max(50_000),
  height: z.number().int().positive().max(50_000),
});
