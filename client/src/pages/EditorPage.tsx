import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import type { UploadResult } from "@uppy/core";
import {
  ObjectUploader,
  type ObjectUploadBody,
  type ObjectUploaderRef,
} from "@/components/ObjectUploader";
import ImageCanvas from "@/components/ImageCanvas";
import EditHistory, { type HistoryItem } from "@/components/EditHistory";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, History, Image as ImageIcon, Menu, ShieldCheck, Sparkles, Upload as UploadIcon, WandSparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Image, Edit } from "@shared/schema";
import { EditorCache, debounce } from "@/utils/editorCache";
import {
  getRestoreFailureAction,
  type EditorRestoreSource,
} from "@/utils/editorRestore";
import MobileBottomSheet from "@/components/MobileBottomSheet";
import MobileSideDrawer from "@/components/MobileSideDrawer";
import { useRateLimit } from "@/contexts/RateLimitContext";
import { LimitReachedModal } from "@/components/LimitReachedModal";
import { PromoCodeSuccessModal } from "@/components/PromoCodeSuccessModal";

type EditWithUI = Edit & { isSaved: boolean };
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export default function EditorPage() {
  const params = useParams();
  const imageIdFromUrl = params.imageId ? parseInt(params.imageId) : null;
  const [uploadedImage, setUploadedImage] = useState<Image | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentBaseEditId, setCurrentBaseEditId] = useState<number | null>(null);
  const [overwriteLastSave, setOverwriteLastSave] = useState(false);
  const [promptText, setPromptText] = useState("");
  const { toast } = useToast();
  
  const [edits, setEdits] = useState<EditWithUI[]>([]);
  
  // Rate limiting state
  const { remaining, isAdmin, refresh: refreshRateLimit } = useRateLimit();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  
  // Mobile state management
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const hasAttemptedRestore = useRef(false);
  const currentRestoreToken = useRef<number>(0);
  const isInitializing = useRef(true); // Prevent cache saves during initial load
  const uploaderRef = useRef<ObjectUploaderRef>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync with state for debounced saves
  const uploadedImageRef = useRef(uploadedImage);
  const editsRef = useRef(edits);
  const currentBaseEditIdRef = useRef(currentBaseEditId);
  const showComparisonRef = useRef(showComparison);
  const overwriteLastSaveRef = useRef(overwriteLastSave);
  const promptTextRef = useRef(promptText);

  useEffect(() => {
    uploadedImageRef.current = uploadedImage;
    editsRef.current = edits;
    currentBaseEditIdRef.current = currentBaseEditId;
    showComparisonRef.current = showComparison;
    overwriteLastSaveRef.current = overwriteLastSave;
    promptTextRef.current = promptText;
  }, [uploadedImage, edits, currentBaseEditId, showComparison, overwriteLastSave, promptText]);

  // Screen size detection
  const [isMediumScreen, setIsMediumScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMediumScreen(width >= 768 && width < 1024); // Between tablet and desktop (lg breakpoint)
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[EditorPage] State changed:', {
      showComparison,
      currentBaseEditId,
      editsCount: edits.length
    });
  }, [showComparison, currentBaseEditId, edits.length]);

  const mockSuggestions = [
    { id: 1, prompt: "Render the subject with a 50% more athletic physique. Keep the clothing exactly the same, but show the physical changes through the fabric.", category: "Change body" },
    { id: 2, prompt: "Dress the user in asap rocky like vibe clothing to be made entirely of flowing, reflective liquid gold. High contrast reflections, expensive luxury look.", category: "Change clothes" },
    { id: 3, prompt: "Place a colossal, building-sized pigeon (bird) behind the user it has godzila head with fire-red eyes walking in the city background. It should look menacing like Godzilla. Low angle shot.", category: "Background object" },
    { id: 4, prompt: "Apply a thermal heat-map aura outlining the body. The edges of the person should glow bright orange and red (hot), fading into deep blue (cold). Add distortion like a melted VHS tape around the limbs.", category: "Cool aura" },
    { id: 5, prompt: "Transform the image into a cracked, 17th-century oil painting. Deep shadows (chiaroscuro), visible heavy brushstrokes, and a golden varnish finish. it's like rap album cover but without any writings", category: "Adjust style" }
  ];

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, ObjectUploadBody>) => {
    try {
      // Cancel any in-flight restore operations
      currentRestoreToken.current++;
      
      if (!result.successful || result.successful.length === 0) {
        throw new Error("No files uploaded");
      }

      const uploadedFile = result.successful[0];
      const uploadUrl = uploadedFile.uploadURL;
      
      // Get image dimensions
      const dimensions = await getImageDimensions(uploadedFile.data as File);

      // Create image record in database
      const response = await apiRequest("POST", "/api/images", {
        uploadUrl,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size || 0,
        width: dimensions.width,
        height: dimensions.height,
      });

      const image: Image = await response.json();
      setUploadedImage(image);
      
      // Set as last active image
      EditorCache.setLastActiveImageId(image.id);
      
      // Load cached state for this image (if any)
      loadCachedState(image.id);
      
      // Allow cache saves now that upload is complete
      isInitializing.current = false;

      toast({
        title: "Image uploaded successfully",
        description: "You can now start editing your image with AI",
      });
    } catch (error) {
      console.error("Error creating image record:", error);
      toast({
        title: "Upload failed",
        description: "Failed to save image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch image by ID from API
  const fetchImageById = async (
    imageId: number,
    source: EditorRestoreSource,
  ): Promise<Image | null> => {
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const failureAction = getRestoreFailureAction(source, response.status);
        if (failureAction === "discard-stale-cache") {
          EditorCache.clear(imageId);
          EditorCache.clearLastActiveImageId();
          return null;
        }
        throw new Error('Failed to fetch image');
      }
      return await response.json();
    } catch (error) {
      console.error('[EditorPage] Failed to fetch image:', error);
      toast({
        title: "Failed to load image",
        description: "Could not restore your editing session",
        variant: "destructive",
      });
      return null;
    }
  };

  // Fetch edit history from API
  const fetchEditHistory = async (imageId: number): Promise<EditWithUI[]> => {
    try {
      const response = await apiRequest("GET", `/api/edits/image/${imageId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch edits');
      }
      const edits: Edit[] = await response.json();
      return edits.map(edit => ({
        ...edit,
        isSaved: edit.savedImageId !== null,
      }));
    } catch (error) {
      console.error('[EditorPage] Failed to fetch edit history:', error);
      return [];
    }
  };

  // Load cached state for an image (only UI state, not edits from API)
  const loadCachedState = (imageId: number, skipEdits: boolean = false) => {
    const cached = EditorCache.load(imageId);
    if (cached) {
      console.log('[EditorPage] Restoring state from cache');
      if (!skipEdits) {
        setEdits(cached.edits || []);
      }
      setCurrentBaseEditId(cached.currentBaseEditId);
      
      // Restore showComparison, or auto-enable if there are edits
      const shouldShowComparison = cached.showComparison || 
        (cached.edits && cached.edits.length > 0);
      setShowComparison(shouldShowComparison);
      
      setPromptText(cached.generateInputText);
      setOverwriteLastSave(cached.overwriteLastSave);
      
      console.log('[EditorPage] Restored showComparison:', shouldShowComparison);
      console.log('[EditorPage] Restored currentBaseEditId:', cached.currentBaseEditId);
    }
  };

  // Restore complete session (image + edits + cache)
  const restoreSession = async (imageId: number, source: EditorRestoreSource) => {
    // Generate unique token for this restore operation
    const restoreToken = ++currentRestoreToken.current;
    console.log('[EditorPage] Restoring session for imageId:', imageId, 'token:', restoreToken);
    
    // Fetch image data
    const image = await fetchImageById(imageId, source);
    if (!image) return;
    
    // Check if this restore was cancelled (new upload or reset happened)
    if (restoreToken !== currentRestoreToken.current) {
      console.log('[EditorPage] Session restore cancelled - token mismatch (new operation started)');
      return;
    }
    
    setUploadedImage(image);
    
    // Fetch edit history from API (source of truth)
    const editHistory = await fetchEditHistory(imageId);
    
    // Double-check again after async fetch
    if (restoreToken !== currentRestoreToken.current) {
      console.log('[EditorPage] Session restore cancelled after edit fetch - token mismatch');
      return;
    }
    
    setEdits(editHistory);
    
    // Restore cached UI state (prompt, overwrite, base selection) but skip edits since we got them from API
    loadCachedState(imageId, true);
    
    // Set as last active
    EditorCache.setLastActiveImageId(imageId);
    
    // Allow cache saves now that initialization is complete
    isInitializing.current = false;
    
    console.log('[EditorPage] Session restored successfully');
  };

  // Auto-restore session on mount (from URL param or last active)
  useEffect(() => {
    // Only run once on first mount
    if (hasAttemptedRestore.current || uploadedImage) return;
    hasAttemptedRestore.current = true;

    // Priority 1: Image ID from URL parameter
    if (imageIdFromUrl) {
      console.log('[EditorPage] Restoring session from URL imageId:', imageIdFromUrl);
      restoreSession(imageIdFromUrl, "url");
      return;
    }

    // Priority 2: Last active session from cache
    const lastActiveId = EditorCache.getLastActiveImageId();
    if (lastActiveId) {
      console.log('[EditorPage] Found last active session, restoring...');
      restoreSession(lastActiveId, "cache");
    }
  }, [uploadedImage, imageIdFromUrl]);

  // Save state to cache using refs for latest values
  const saveToCacheFromRefs = useCallback(() => {
    const image = uploadedImageRef.current;
    if (!image || isInitializing.current) return; // Don't save during initialization
    
    // Cancel any pending debounced saves to prevent stale data from overwriting
    debouncedSaveRef.current.cancel();
    
    EditorCache.save(image.id, {
      edits: editsRef.current,
      currentBaseEditId: currentBaseEditIdRef.current,
      showComparison: showComparisonRef.current,
      generateInputText: promptTextRef.current,
      overwriteLastSave: overwriteLastSaveRef.current,
    });
  }, []);

  // Create single debounced save instance
  const debouncedSaveRef = useRef(
    debounce(() => {
      const image = uploadedImageRef.current;
      if (!image || isInitializing.current) return; // Don't save during initialization
      
      EditorCache.save(image.id, {
        edits: editsRef.current,
        currentBaseEditId: currentBaseEditIdRef.current,
        showComparison: showComparisonRef.current,
        generateInputText: promptTextRef.current,
        overwriteLastSave: overwriteLastSaveRef.current,
      });
    }, 500)
  );

  // Save to cache immediately when edits, base, comparison, or overwrite changes (not debounced)
  useEffect(() => {
    if (uploadedImage) {
      saveToCacheFromRefs();
    }
  }, [edits, currentBaseEditId, showComparison, overwriteLastSave, uploadedImage, saveToCacheFromRefs]);

  // Save before unmounting
  useEffect(() => {
    return () => {
      console.log('[EditorPage] Saving state before unmount');
      saveToCacheFromRefs();
    };
  }, [saveToCacheFromRefs]);

  const handlePromptSubmit = async (prompt: string) => {
    if (!uploadedImage) return;
    
    setIsProcessing(true);
    console.log('Processing prompt:', prompt);
    
    let response: Response | undefined;
    
    try {
      // Call the backend API to generate the edit
      // If a base edit is selected, pass it to use as the source image
      const requestBody: any = {
        imageId: uploadedImage.id,
        prompt: prompt,
        provider: "openrouter",
      };
      
      if (currentBaseEditId !== null) {
        requestBody.baseEditId = currentBaseEditId;
        console.log('Using edit as base:', currentBaseEditId);
      }
      
      response = await apiRequest("POST", "/api/edits", requestBody);

      // Parse response first to check for promo code
      const responseData = await response.json();
      
      // Handle promo code response (can be success or error)
      if (responseData.isPromoCode) {
        if (responseData.success) {
          setShowPromoModal(true);
          refreshRateLimit().catch(err => console.error('Failed to refresh rate limit:', err));
        } else {
          // Promo code already used or error
          throw new Error(responseData.error || responseData.message || "Promo code error");
        }
        return;
      }

      // Now check if response was ok for regular edits
      if (!response.ok) {
        // Handle rate limit exceeded (429)
        if (response.status === 429) {
          refreshRateLimit().catch(err => console.error('Failed to refresh rate limit:', err));
          setShowLimitModal(true);
          return;
        }
        
        // Generic error handling
        if (responseData?.message || responseData?.error) {
          throw new Error(responseData.message || responseData.error);
        }
        throw new Error("Failed to generate edit");
      }

      // Regular edit response - must have edit data
      if (!responseData.id && !responseData.edit) {
        throw new Error("Invalid response format from server");
      }
      
      const edit: Edit = responseData.edit || responseData;
      
      // Refresh rate limit counter after successful edit (non-blocking)
      refreshRateLimit().catch(err => console.error('Failed to refresh rate limit:', err));
      
      // Add the new edit to the list
      const newEdit: EditWithUI = {
        ...edit,
        isSaved: false,
      };
      
      setEdits([newEdit, ...edits]);
      
      // Update the current image to show the edited version
      setUploadedImage({
        ...uploadedImage,
        currentUrl: edit.resultUrl,
      });
      
      setShowComparison(true);
      
      toast({
        title: "Edit complete!",
        description: "Your image has been edited successfully",
      });

      // Auto-refetch edits after 2 seconds to get generated thumbnail
      // Background worker needs time to generate and save thumbnailUrl to DB
      setTimeout(async () => {
        try {
          console.log('[EditorPage] Refetching edits to get generated thumbnails');
          const freshEdits = await fetchEditHistory(uploadedImage.id);
          setEdits(freshEdits);
        } catch (error) {
          console.error('[EditorPage] Failed to refetch edits:', error);
          // Silent fail - user won't notice, will get thumbnail on next page load
        }
      }, 2000);
    } catch (error) {
      console.error('Error generating edit:', error);
      
      // Default error message
      let errorMessage = "Failed to generate edit. Please try again.";
      let errorTitle = "Edit failed";
      
      // Extract error message from caught error
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for quota exceeded message
        if (errorMessage.includes("quota") || errorMessage.includes("usage limit")) {
          errorTitle = "API Quota Exceeded";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const response = await apiRequest("POST", `/api/edits/${id}/save`, {
        overwriteLastSave,
      });

      const data = await response.json();

      // Update local state to mark as saved
      setEdits(edits.map(e => 
        e.id === id ? { ...e, isSaved: true } : e
      ));

      toast({
        title: "Saved to gallery",
        description: data.message,
      });
    } catch (error) {
      console.error('Error saving edit:', error);
      toast({
        title: "Save failed",
        description: "Failed to save edit. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUseAsBase = (id: number | string) => {
    // If it's the original image (string ID like "original-1"), set to null
    // Otherwise use the edit ID
    const baseEditId = typeof id === 'string' ? null : id;
    setCurrentBaseEditId(baseEditId);
    
    const description = baseEditId === null 
      ? "Future edits will use the original uploaded image"
      : "Future edits will be based on this version";
    
    toast({
      title: "Base image updated",
      description,
    });
  };

  const handleReset = () => {
    // Cancel any in-flight restore operations
    currentRestoreToken.current++;
    
    if (uploadedImage) {
      EditorCache.clear(uploadedImage.id);
      // Clear last active since user explicitly reset
      EditorCache.setLastActiveImageId(0);
    }
    setUploadedImage(null);
    setEdits([]);
    setShowComparison(false);
    setCurrentBaseEditId(null);
    setPromptText("");
    setOverwriteLastSave(false);
    isInitializing.current = true; // Reset flag for next upload
  };

  const handleNewProject = () => {
    // Cancel any in-flight restore operations
    currentRestoreToken.current++;
    
    if (uploadedImage) {
      EditorCache.clear(uploadedImage.id);
    }
    
    // Clear the last active ID so session doesn't auto-restore
    EditorCache.clearLastActiveImageId();
    
    // Reset all state
    setUploadedImage(null);
    setEdits([]);
    setShowComparison(false);
    setCurrentBaseEditId(null);
    setPromptText("");
    setOverwriteLastSave(false);
    isInitializing.current = true; // Reset flag for next upload
    
    toast({
      title: "New project started",
      description: "Upload an image to begin editing",
    });
  };

  // Handle prompt text change with debounced save
  const handlePromptChange = (text: string) => {
    setPromptText(text);
    debouncedSaveRef.current();
  };

  // Handle suggestion click - replace prompt
  const handleSuggestionSelect = (suggestionText: string) => {
    setPromptText(suggestionText);
    debouncedSaveRef.current();
    console.log('[EditorPage] Suggestion selected:', suggestionText);
  };

  // Drag-and-drop handlers for upload zone
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging if we have files
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Keep dragging state active while over drop zone (prevents flickering)
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide overlay if we're leaving the drop zone entirely
    // Check if relatedTarget is outside drop zone
    const relatedTarget = e.relatedTarget as Node;
    
    if (dropZoneRef.current && !dropZoneRef.current.contains(relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPEG, PNG, or WebP images only",
        variant: "destructive",
      });
      return;
    }

    // Keep drag-and-drop validation aligned with the uploader and server policy.
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Use ObjectUploader's uppy instance for consistent upload flow
    try {
      const uppy = uploaderRef.current?.uppy;
      if (!uppy) {
        throw new Error("Uploader not initialized");
      }

      // Add file to uppy
      uppy.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });

      // Start upload - onComplete handler will be called automatically
      await uppy.upload();
    } catch (error) {
      console.error("Error uploading via drag-and-drop:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Build combined history array with original image first
  const historyItems: HistoryItem[] = uploadedImage ? [
    {
      id: `original-${uploadedImage.id}`,
      resultUrl: uploadedImage.originalUrl,
      thumbnailUrl: uploadedImage.thumbnailUrl,
      prompt: 'Original',
      createdAt: uploadedImage.createdAt,
      isSaved: false,
      isOriginal: true,
    },
    ...edits.map(edit => ({
      id: edit.id,
      resultUrl: edit.resultUrl,
      thumbnailUrl: edit.thumbnailUrl,
      prompt: edit.prompt,
      createdAt: edit.createdAt,
      isSaved: edit.isSaved,
      isOriginal: false,
    }))
  ] : [];

  if (!uploadedImage) {
    return (
      <div className="relative flex min-h-[calc(100svh-3.5rem)] items-center overflow-hidden bg-background px-4 py-10 sm:px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_25%,hsl(var(--primary)/0.12),transparent_42%)]" />
        <div 
          ref={dropZoneRef}
          className="site-container relative max-w-5xl px-0 sm:px-0 lg:px-0"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Overlay when dragging */}
          {isDragging && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-primary">
                  Drop image here
                </div>
                <div className="text-sm text-muted-foreground">
                  Release to upload
                </div>
              </div>
            </div>
          )}
          
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="outline" className="mb-5 gap-2 bg-background/70 shadow-xs">
              <WandSparkles className="h-3.5 w-3.5 text-primary" />
              New AI edit
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Start with one image</h1>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground sm:text-lg">
              Upload a photo, then describe the change you want in plain language.
            </p>
          </div>
          <div className="mt-9 flex justify-center">
            <ObjectUploader
              ref={uploaderRef}
              maxNumberOfFiles={1}
              maxFileSize={MAX_IMAGE_SIZE_BYTES}
              onComplete={handleUploadComplete}
              buttonClassName={`group h-72 w-full max-w-3xl rounded-xl border-2 border-dashed bg-card/80 shadow-sm transition-[border-color,background-color,box-shadow,transform] hover:border-primary/45 hover:bg-primary/[0.03] hover:shadow-md ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <div className="flex flex-col items-center gap-5 whitespace-normal px-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 transition-transform group-hover:-translate-y-0.5">
                  <UploadIcon className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-lg font-semibold sm:text-xl">
                    Click or drag and drop an image
                  </p>
                  <p className="text-sm font-normal text-muted-foreground">
                    JPEG, PNG, or WebP up to 10MB
                  </p>
                </div>
              </div>
            </ObjectUploader>
          </div>

          <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[
              [ImageIcon, "One original", "Your source stays available"],
              [History, "Version history", "Build on any earlier edit"],
              [ShieldCheck, "Private files", "Protected account access"],
            ].map(([Icon, title, description]) => {
              const FeatureIcon = Icon as typeof ImageIcon;
              return (
                <div key={title as string} className="flex gap-3 rounded-lg border bg-muted/20 p-3.5 text-left">
                  <FeatureIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{title as string}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{description as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return isMobile ? (
    // MOBILE LAYOUT
    <div className="flex min-h-full flex-col bg-background">
      {/* Mobile editing toolbar */}
      <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Editing tools</p>
          <p className="text-xs text-muted-foreground">History and project actions</p>
        </div>
        <button
          onClick={() => setShowMenu(true)}
          className="rounded-md border bg-background p-2 shadow-2xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Open menu"
          data-testid="button-menu-mobile"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Image Preview */}
        <div className="relative mb-4 overflow-hidden rounded-lg border bg-muted/20 p-2 shadow-sm">
          {showComparison ? (
            (() => {
              const baseEdit = currentBaseEditId !== null 
                ? edits.find(e => e.id === currentBaseEditId)
                : null;
              const baseImageUrl = baseEdit?.resultUrl || uploadedImage.originalUrl;
              const afterImageUrl = edits[0]?.resultUrl || uploadedImage.currentUrl;
              const isUsingBase = currentBaseEditId !== null && baseEdit !== undefined;
              
              return (
                <div className="overflow-hidden rounded-md">
                  <BeforeAfterSlider
                    beforeImage={baseImageUrl}
                    afterImage={afterImageUrl}
                    beforeLabel={isUsingBase ? "Selected Base" : "Original"}
                    afterLabel="Current Edit"
                    afterPrompt={edits.length > 0 ? edits[0]?.prompt : undefined}
                  />
                </div>
              );
            })()
          ) : (
            <img
              src={uploadedImage.currentUrl}
              alt="Editor preview"
              className="h-auto w-full rounded-md"
              data-testid="img-editor-preview"
            />
          )}
          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
              <ProcessingIndicator progress={65} />
            </div>
          )}
        </div>

        {/* Prompt Field - ABOVE Provider */}
        <Card className="mb-4 p-4">
          <label className="mb-2 block text-sm font-semibold">Describe Your Edit</label>
          <Textarea
            placeholder="E.g., 'Make the sky more dramatic' or 'Add warm tones'"
            value={promptText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePromptChange(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey && promptText.trim() && !isProcessing) {
                e.preventDefault();
                handlePromptSubmit(promptText);
              }
            }}
            disabled={isProcessing}
            className="min-h-[100px] resize-none"
            data-testid="input-prompt-mobile"
          />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Press Enter to generate, Shift + Enter for new line
          </p>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={() => handlePromptSubmit(promptText)}
          disabled={isProcessing || !promptText.trim()}
          className="mb-3 w-full"
          size="lg"
          data-testid="button-generate-mobile"
        >
          {isProcessing ? 'Generating...' : 'Generate'}
        </Button>

        {/* Quick Suggestions Button */}
        <Button
          onClick={() => setShowQuickSuggestions(true)}
          variant="outline"
          className="w-full gap-2"
          size="lg"
          data-testid="button-show-suggestions"
        >
          <Sparkles className="h-4 w-4" />
          Quick Suggestions
        </Button>
      </main>

      {/* Bottom Sheets and Drawers */}
      {showQuickSuggestions && (
        <MobileBottomSheet
          onClose={() => setShowQuickSuggestions(false)}
          suggestions={mockSuggestions}
          onSelect={(prompt) => {
            handleSuggestionSelect(prompt);
            setShowQuickSuggestions(false);
          }}
        />
      )}

      {showMenu && (
        <MobileSideDrawer
          onClose={() => setShowMenu(false)}
          historyItems={historyItems}
          onUploadNew={handleReset}
          onNewProject={handleNewProject}
          onUseAsBase={handleUseAsBase}
          onSave={handleSaveEdit}
          activeItemId={edits[0]?.id}
          currentBaseId={currentBaseEditId}
        />
      )}
    </div>
  ) : (
    // DESKTOP AND MEDIUM SCREEN LAYOUT
    <div className="site-container max-w-[1500px] py-6 sm:py-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        {/* Left Sidebar - Edit History (Desktop Only >= 1024px) */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 h-[calc(100svh-6.5rem)] overflow-hidden rounded-lg border bg-card shadow-xs">
            <EditHistory
              historyItems={historyItems}
              activeItemId={edits[0]?.id}
              currentBaseId={currentBaseEditId}
              overwriteLastSave={overwriteLastSave}
              onOverwriteToggle={setOverwriteLastSave}
              onSave={handleSaveEdit}
              onUseAsBase={handleUseAsBase}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Top Actions with Hamburger Menu for Medium Screens */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 shadow-xs">
            <Badge variant="secondary" className="mr-auto hidden gap-1.5 sm:inline-flex">
              <WandSparkles className="h-3.5 w-3.5 text-primary" />
              Active project
            </Badge>
            {isMediumScreen && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowMenu(true)} 
                data-testid="button-menu-medium"
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset} data-testid="button-reset">
              <ArrowLeft className="h-4 w-4" />
              Upload Different Image
            </Button>
            <Button variant="outline" size="sm" onClick={handleNewProject} data-testid="button-new-project">
              New Project
            </Button>
          </div>

          {/* Editor Area - Image and Control Panel Side by Side */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* Image Preview */}
            <Card className="flex min-h-[34rem] items-center justify-center overflow-hidden bg-muted/20 p-3 sm:p-5">
              <div className="relative w-full max-w-[450px] lg:max-w-[600px] 2xl:max-w-[750px]">
                {showComparison ? (
                  (() => {
                    const baseEdit = currentBaseEditId !== null 
                      ? edits.find(e => e.id === currentBaseEditId)
                      : null;
                    const baseImageUrl = baseEdit?.resultUrl || uploadedImage.originalUrl;
                    const afterImageUrl = edits[0]?.resultUrl || uploadedImage.currentUrl;
                    const isUsingBase = currentBaseEditId !== null && baseEdit !== undefined;
                    
                    return (
                      <div className="overflow-hidden rounded-lg border bg-background shadow-lg">
                        <BeforeAfterSlider
                          beforeImage={baseImageUrl}
                          afterImage={afterImageUrl}
                          beforeLabel={isUsingBase ? "Selected Base" : "Original"}
                          afterLabel="Current Edit"
                          afterPrompt={edits.length > 0 ? edits[0]?.prompt : undefined}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <ImageCanvas imageUrl={uploadedImage.currentUrl} />
                )}
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                    <ProcessingIndicator progress={65} />
                  </div>
                )}
              </div>
            </Card>

            {/* Control Panel */}
            <Card className="flex flex-col gap-5 p-5 sm:p-6">
              {/* Prompt Field - FULL WIDTH, ABOVE AI Provider */}
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <WandSparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <label className="block text-sm font-semibold">
                  Describe Your Edit
                    </label>
                    <p className="text-xs text-muted-foreground">Tell the AI what should change</p>
                  </div>
                </div>
                <Textarea
                  placeholder="E.g., 'Make the sky more dramatic with sunset colors' or 'Add warm golden hour tones'"
                  value={promptText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handlePromptChange(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' && !e.shiftKey && promptText.trim() && !isProcessing) {
                      e.preventDefault();
                      handlePromptSubmit(promptText);
                    }
                  }}
                  disabled={isProcessing}
                  className="min-h-[120px] resize-none"
                  data-testid="input-prompt"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Be specific for best results • Press Enter to generate, Shift + Enter for new line
                </p>
              </div>

              {/* Generate Button with Rate Limit Counter */}
              <div className="space-y-2">
                <Button
                  onClick={() => handlePromptSubmit(promptText)}
                  disabled={isProcessing || !promptText.trim()}
                  className="w-full"
                  size="lg"
                  data-testid="button-generate"
                >
                  {isProcessing ? 'Generating...' : 'Generate'}
                </Button>
                
                {!isAdmin && (
                  <p className="text-xs text-center text-muted-foreground" data-testid="text-rate-limit">
                    {remaining} {remaining === 1 ? 'edit' : 'edits'} remaining this month
                  </p>
                )}
              </div>

              {/* Quick Suggestions - COMPACT VERSION */}
              <div className="border-t pt-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Quick Suggestions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {mockSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion.prompt)}
                      className="group rounded-lg border bg-background p-3 text-left shadow-2xs transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`suggestion-${suggestion.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {suggestion.prompt}
                          </p>
                          {suggestion.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              {suggestion.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Side Drawer for Medium Screens */}
      {showMenu && (
        <MobileSideDrawer
          onClose={() => setShowMenu(false)}
          historyItems={historyItems}
          onUploadNew={handleReset}
          onNewProject={handleNewProject}
          onUseAsBase={handleUseAsBase}
          onSave={handleSaveEdit}
          activeItemId={edits[0]?.id}
          currentBaseId={currentBaseEditId}
        />
      )}
      
      {/* Rate Limit Modals */}
      <LimitReachedModal 
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
      />
      <PromoCodeSuccessModal 
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
      />
    </div>
  );
}
