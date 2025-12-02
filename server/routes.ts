// Integration: Replit Auth (blueprint:javascript_log_in_with_replit)
// Integration: Object Storage (blueprint:javascript_object_storage)
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertImageSchema, edits, images } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { editImageWithGemini } from "./gemini";
import { editImageWithHuggingFace } from "./huggingface";
import { generateThumbnailsBatch, generateThumbnailInBackground, generateEditThumbnailInBackground } from "./thumbnailHelpers";
import { checkRateLimit, incrementRateLimit, isPromoCode, applyPromoCode } from './rateLimiting';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth middleware
  await setupAuth(app);

  // Auth route - Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public endpoint for thumbnails (checks ACL, no auth required)
  // Must be BEFORE the main /objects/* route to match first
  app.get("/objects/uploads/:uploadId/thumb.webp", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const thumbPath = `/objects/uploads/${req.params.uploadId}/thumb.webp`;
      const objectFile = await objectStorageService.getObjectEntityFile(thumbPath);
      
      // Check if thumbnail is public via ACL policy
      const aclPolicy = await objectStorageService.getObjectAclPolicy(thumbPath);
      if (aclPolicy?.visibility !== "public") {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving thumbnail:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Object Storage - Serve private objects with ACL check
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get presigned upload URL
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Create image record after upload
  app.post("/api/images", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate request body - only metadata from client
      const uploadRequestSchema = z.object({
        uploadUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        width: z.number(),
        height: z.number(),
      });
      const validatedData = uploadRequestSchema.parse(req.body);

      // Set ACL policy and normalize path
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        validatedData.uploadUrl,
        {
          owner: userId,
          visibility: "private", // Images are private to the owner
        }
      );

      // Create a new project for this image
      const project = await storage.createProject({
        userId,
        name: `Project: ${validatedData.fileName}`,
      });

      // Create image record in database linked to the project
      const image = await storage.createImage({
        userId,
        projectId: project.id,
        originalUrl: objectPath,
        currentUrl: objectPath,
        fileName: validatedData.fileName,
        fileSize: validatedData.fileSize,
        width: validatedData.width,
        height: validatedData.height,
      });

      // Generate thumbnail in background (don't await - let it complete async)
      generateThumbnailInBackground(image.id, image.originalUrl).catch(err => {
        console.error(`[Upload] Failed to generate thumbnail for image ${image.id}:`, err);
      });

      res.status(201).json(image);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating image:", error);
      res.status(500).json({ error: "Failed to create image" });
    }
  });

  // Get user's images
  app.get("/api/images", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userImages = await storage.getUserImages(userId);
      res.json(userImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Get single image
  app.get("/api/images/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageId = parseInt(req.params.id);
      if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      const image = await storage.getImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Ensure user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(image);
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // Update image (e.g., save an edit as the current version)
  app.put("/api/images/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageId = parseInt(req.params.id);
      if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      const image = await storage.getImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Ensure user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Validate update data
      const updateSchema = z.object({
        currentUrl: z.string().optional(),
      });
      const validatedData = updateSchema.parse(req.body);

      const updatedImage = await storage.updateImage(imageId, validatedData);
      res.json(updatedImage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error updating image:", error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  // Create an edit (generate edited image using Gemini)
  app.post("/api/edits", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate request body
      const editRequestSchema = z.object({
        imageId: z.number(),
        prompt: z.string().min(1).max(500),
        baseEditId: z.number().optional(),
        provider: z.enum(["huggingface", "gemini"]).default("huggingface"),
      });
      const { imageId, prompt, baseEditId, provider } = editRequestSchema.parse(req.body);

      // === PROMO CODE CHECK ===
      if (isPromoCode(prompt)) {
        const result = await applyPromoCode(userId);
        
        if (result.success) {
          return res.json({
            success: true,
            isPromoCode: true,
            message: result.message,
          });
        } else {
          return res.status(400).json({
            success: false,
            isPromoCode: true,
            error: result.message,
          });
        }
      }

      // === RATE LIMIT CHECK ===
      const rateLimit = await checkRateLimit(userId);
      
      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: "API limit reached",
          remaining: 0,
          resetDate: rateLimit.resetDate,
          limitReached: true,
        });
      }

      // Get the image
      const image = await storage.getImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      // Ensure user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Determine source image URL
      let sourceImageUrl = image.currentUrl;
      
      // If baseEditId is provided, use that edit's result as the source
      if (baseEditId) {
        const [baseEdit] = await db.select().from(edits).where(eq(edits.id, baseEditId));
        if (!baseEdit) {
          return res.status(404).json({ error: "Base edit not found" });
        }
        
        // Verify ownership
        if (baseEdit.userId !== userId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        
        sourceImageUrl = baseEdit.resultUrl;
        console.log(`Using edit ${baseEditId} as base for new edit`);
      }

      // Download the image from object storage
      const objectStorageService = new ObjectStorageService();
      const imageFile = await objectStorageService.getObjectEntityFile(sourceImageUrl);
      
      // Download the file contents to a buffer
      const [sourceImageBuffer] = await imageFile.download();
      
      // Create a data URL from the buffer
      const sourceImageBase64 = sourceImageBuffer.toString("base64");
      const contentType = (await imageFile.getMetadata())[0].contentType || "image/jpeg";
      const imageDataUrl = `data:${contentType};base64,${sourceImageBase64}`;

      // Call the appropriate AI provider based on selection
      console.log(`Calling ${provider} API to edit image...`, { prompt });
      
      let editResult;
      
      switch (provider) {
        case "huggingface":
          if (!process.env.HUGGINGFACE_API_KEY) {
            return res.status(500).json({ 
              error: "Hugging Face API key not configured",
              message: "Please add HUGGINGFACE_API_KEY to your Secrets to use Hugging Face.",
            });
          }
          editResult = await editImageWithHuggingFace({
            imageUrl: imageDataUrl,
            prompt,
          });
          break;
        
        case "gemini":
          if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ 
              error: "Gemini API key not configured",
              message: "Please add GEMINI_API_KEY to your Secrets to use Gemini.",
            });
          }
          editResult = await editImageWithGemini({
            imageUrl: imageDataUrl,
            prompt,
          });
          break;
        
        default:
          return res.status(400).json({ error: `Invalid provider: ${provider}` });
      }

      // Convert base64 to buffer and upload to object storage
      const editedImageBuffer = Buffer.from(editResult.imageData, "base64");
      
      // Get presigned upload URL
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Upload the edited image
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: editedImageBuffer,
        headers: {
          "Content-Type": editResult.mimeType,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload edited image: ${uploadResponse.statusText}`);
      }

      // Set ACL policy for the uploaded image
      const resultPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: userId,
          visibility: "private",
        }
      );

      // Save edit to database
      const edit = await storage.createEdit({
        imageId,
        userId,
        prompt,
        resultUrl: resultPath,
      });

      // === INCREMENT COUNTER (only on success) ===
      await incrementRateLimit(userId);

      // === GET UPDATED RATE LIMIT ===
      const newRateLimit = await checkRateLimit(userId);

      // Generate thumbnail in background (fire-and-forget)
      generateEditThumbnailInBackground(edit.id, resultPath).catch(err => {
        console.error(`Failed to queue thumbnail generation for edit ${edit.id}:`, err);
      });

      console.log("Edit created successfully:", edit);
      
      // === RETURN SUCCESS WITH RATE LIMIT INFO ===
      res.status(201).json({
        ...edit,
        rateLimit: {
          remaining: newRateLimit.remaining,
          isLastEdit: newRateLimit.isLastEdit,
          resetDate: newRateLimit.resetDate,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      
      console.error("Error creating edit:", error);
      
      // Handle specific Gemini API errors
      if (error instanceof Error) {
        if (error.message.startsWith("QUOTA_EXCEEDED:")) {
          return res.status(429).json({ 
            error: "API quota exceeded",
            message: "You've reached your Gemini API usage limit. Please try again later or upgrade your plan.",
            details: error.message.replace("QUOTA_EXCEEDED: ", "")
          });
        }
        
        if (error.message.startsWith("INVALID_API_KEY:")) {
          return res.status(500).json({ 
            error: "Configuration error",
            message: "API key configuration issue. Please contact support.",
            details: error.message.replace("INVALID_API_KEY: ", "")
          });
        }
        
        if (error.message.startsWith("API_ACCESS_DENIED:")) {
          return res.status(403).json({ 
            error: "API access denied",
            message: "Unable to access the image editing service. Please try again later.",
            details: error.message.replace("API_ACCESS_DENIED: ", "")
          });
        }
      }
      
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create edit" });
    }
  });

  // Save an edit as a new image in the gallery
  app.post("/api/edits/:editId/save", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const editId = parseInt(req.params.editId);
      const { overwriteLastSave } = z.object({
        overwriteLastSave: z.boolean().default(false),
      }).parse(req.body);

      // Get the edit
      const [edit] = await db.select().from(edits).where(eq(edits.id, editId));
      if (!edit) {
        return res.status(404).json({ error: "Edit not found" });
      }

      // Get the parent image
      const parentImage = await storage.getImage(edit.imageId);
      if (!parentImage) {
        return res.status(404).json({ error: "Parent image not found" });
      }

      // Ensure user owns the edit
      if (edit.userId !== userId || parentImage.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Save the edit as an image
      const savedImage = await storage.saveEditAsImage(edit, parentImage, overwriteLastSave);

      // Generate thumbnail for saved edit (fire-and-forget)
      generateThumbnailInBackground(savedImage.id, savedImage.originalUrl)
        .catch(err => console.error('[SaveEdit] Thumbnail generation failed:', err));

      res.status(201).json({
        image: savedImage,
        message: overwriteLastSave ? "Previous save overwritten" : "Saved as new image",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      
      console.error("Error saving edit:", error);
      res.status(500).json({ error: "Failed to save edit" });
    }
  });

  // Get edits for an image (alternative route pattern)
  app.get("/api/edits/image/:imageId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageId = parseInt(req.params.imageId);
      if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      // Verify image exists and user owns it
      const image = await storage.getImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      if (image.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const imageEdits = await storage.getImageEdits(imageId);
      res.json(imageEdits);
    } catch (error) {
      console.error("Error fetching edits:", error);
      res.status(500).json({ error: "Failed to fetch edits" });
    }
  });

  // Get edits for an image (original route pattern)
  app.get("/api/images/:id/edits", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageId = parseInt(req.params.id);
      if (isNaN(imageId)) {
        return res.status(400).json({ error: "Invalid image ID" });
      }

      // Verify image exists and user owns it
      const image = await storage.getImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }

      if (image.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const imageEdits = await storage.getImageEdits(imageId);
      res.json(imageEdits);
    } catch (error) {
      console.error("Error fetching edits:", error);
      res.status(500).json({ error: "Failed to fetch edits" });
    }
  });

  // Delete edit
  app.delete("/api/edits/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const editId = parseInt(req.params.id);
      if (isNaN(editId)) {
        return res.status(400).json({ error: "Invalid edit ID" });
      }

      // Get the edit to verify ownership
      const [edit] = await db.select().from(edits).where(eq(edits.id, editId));
      if (!edit) {
        return res.status(404).json({ error: "Edit not found" });
      }

      if (edit.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteEdit(editId);
      res.json({ message: "Edit deleted successfully" });
    } catch (error) {
      console.error("Error deleting edit:", error);
      res.status(500).json({ error: "Failed to delete edit" });
    }
  });

  // Get all projects for the current user
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const projects = await storage.getProjectsForUser(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Get a single project with its original image and edits
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // Delete a project
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ error: "Invalid project ID" });
      }

      const project = await storage.getProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteProject(projectId);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // TEMPORARY: Migration endpoint to create projects for existing images
  app.post("/api/migrate-data", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get all images without a project
      const imagesWithoutProject = await storage.getImagesWithoutProject();
      
      // Filter to only this user's images
      const userImages = imagesWithoutProject.filter(img => img.userId === userId);
      
      // Separate original images from saved edits
      const originalImages = userImages.filter(img => img.isOriginal === 1);
      const savedEdits = userImages.filter(img => img.isOriginal === 0);

      let projectsCreated = 0;
      let imagesLinked = 0;

      // Create a project for each original image
      for (const originalImg of originalImages) {
        const newProject = await storage.createProject({
          userId: userId,
          name: `Project: ${originalImg.fileName}`,
        });
        projectsCreated++;

        // Link the original image to the project
        await storage.updateImageProjectId(originalImg.id, newProject.id);
        imagesLinked++;

        // Link any saved edits that have this image as parent
        const relatedEdits = savedEdits.filter(edit => edit.parentImageId === originalImg.id);
        for (const edit of relatedEdits) {
          await storage.updateImageProjectId(edit.id, newProject.id);
          imagesLinked++;
        }
      }

      res.json({
        message: "Migration successful!",
        projectsCreated,
        imagesLinked,
      });
    } catch (error) {
      console.error("Migration failed:", error);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  /**
   * Admin endpoint: Generate thumbnails for images that don't have them
   * Processes up to 10 images per request to avoid overwhelming the system
   * Can be called multiple times to process all images
   */
  app.post("/api/admin/generate-thumbnails", async (req, res) => {
    try {
      console.log('[Admin] Manual thumbnail generation triggered');

      // Find images without thumbnails (limit to avoid overwhelming system)
      const imagesToProcess = await db
        .select({
          id: images.id,
          originalUrl: images.originalUrl,
        })
        .from(images)
        .where(isNull(images.thumbnailUrl))
        .limit(10);

      if (imagesToProcess.length === 0) {
        console.log('[Admin] No images to process. All thumbnails up to date!');
        return res.json({
          success: true,
          message: 'No images to process. All thumbnails up to date!',
          processed: 0,
          errors: 0,
        });
      }

      console.log(`[Admin] Found ${imagesToProcess.length} images without thumbnails`);

      // Generate thumbnails in batch
      const stats = await generateThumbnailsBatch(imagesToProcess);

      console.log(`[Admin] Complete! Processed: ${stats.processed}, Errors: ${stats.errors}`);

      res.json({
        success: true,
        message: `Processed ${stats.processed} images, ${stats.errors} errors`,
        processed: stats.processed,
        errors: stats.errors,
        remaining: imagesToProcess.length === 10 ? 'More images may need processing' : 'All done',
      });

    } catch (error) {
      console.error('[Admin] Error generating thumbnails:', error);
      res.status(500).json({
        error: 'Failed to generate thumbnails',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

" });
    }
  });

  app.post("/api/test/increment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await incrementRateLimit(userId);
      const result = await checkRateLimit(userId);
      
      return res.json({
        message: "Incremented",
        remaining: result.remaining,
      });
    } catch (error) {
      console.error("Error incrementing rate limit:", error);
      res.status(500).json({ error: "Failed to increment" });
    }
  });

  app.post("/api/test/promo", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      return res.json({
        isPromo: isPromoCode(prompt),
      });
    } catch (error) {
      console.error("Error checking promo code:", error);
      res.status(500).json({ error: "Failed to check promo code" });
    }
  });

  app.post("/api/test/apply-promo", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await applyPromoCode(userId);
      const rateLimit = await checkRateLimit(userId);
      
      return res.json({
        ...result,
        remaining: rateLimit.remaining,
      });
    } catch (error) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ error: "Failed to apply promo code" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
