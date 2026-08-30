import { z } from "zod";

export const imageUploadRequestSchema = z.object({
  uploadUrl: z.string().url().max(8_192),
  fileName: z.string().trim().min(1).max(255).default("Uploaded image"),
});

export function summarizeImageUploadValidation(error: z.ZodError): Array<{
  path: string;
  code: string;
}> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    code: issue.code,
  }));
}
