import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "wouter";
import type { UploadResult } from "@uppy/core";
import UploadZone from "@/components/UploadZone";
import { ObjectUploader } from "@/components/ObjectUploader";
import ImageCanvas from "@/components/ImageCanvas";
import EditHistory, { type HistoryItem } from "@/components/EditHistory";
import PromptSuggestions from "@/components/PromptSuggestions";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload as UploadIcon, Sparkles, Menu } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Image, Edit } from "@shared/schema";
import { EditorCache, debounce } from "@/utils/editorCache";
import MobileBottomSheet from "@/components/MobileBottomSheet";
import MobileSideDrawer from "@/components/MobileSideDrawer";

type EditWithUI = Edit & { isSaved: boolean };

export default function EditorPage() {
  const params = useParams();
  const imageIdFromUrl = params.imageId ? parseInt(params.imageId) : null;
  const [uploadedImage, setUploadedImage] = useState<Image | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [currentBaseEditId, setCurrentBaseEditId] = useState<number | null>(null);
  const [overwriteLastSave, setOverwriteLastSave] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [apiProvider, setApiProvider] = useState<"huggingface" | "gemini">("gemini");
  const { toast } = useToast();
  
  const [edits, setEdits] = useState<EditWithUI[]>([]);
  
  // Mobile state management
  const [isMobile, setIsMobile] = useState(false);
  const [showQuickSuggestions, setShowQuickSuggestions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const hasAttemptedRestore = useRef(false);
  const currentRestoreToken = useRef<number>(0);

  // Keep refs in sync with state for debounced saves
  const uploadedImageRef = useRef(uploadedImage);
  const editsRef = useRef(edits);
  const currentBaseEditIdRef = useRef(currentBaseEditId);
  const overwriteLastSaveRef = useRef(overwriteLastSave);
  const promptTextRef = useRef(promptText);

  useEffect(() => {
    uploadedImageRef.current = uploadedImage;
    editsRef.current = edits;
    currentBaseEditIdRef.current = currentBaseEditId;
    overwriteLastSaveRef.current = overwriteLastSave;
    promptTextRef.current = promptText;
  }, [uploadedImage, edits, currentBaseEditId, overwriteLastSave, promptText]);

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

  const mockSuggestions = [
    { id: 1, prompt: "Make the sky more dramatic with sunset colors", category: "lighting" },
    { id: 2, prompt: "Add warm golden hour tones throughout", category: "color" },
    { id: 3, prompt: "Increase contrast and saturation", category: "color" },
    { id: 4, prompt: "Apply vintage film effect", category: "style" },
    { id: 5, prompt: "Add soft bokeh background blur", category: "effects" }
  ];

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

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

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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
  const fetchImageById = async (imageId: number): Promise<Image | null> => {
    try {
      const response = await apiRequest("GET", `/api/images/${imageId}`);
      if (!response.ok) {
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
      setPromptText(cached.generateInputText);
      setOverwriteLastSave(cached.overwriteLastSave);
    }
  };

  // Restore complete session (image + edits + cache)
  const restoreSession = async (imageId: number) => {
    // Generate unique token for this restore operation
    const restoreToken = ++currentRestoreToken.current;
    console.log('[EditorPage] Restoring session for imageId:', imageId, 'token:', restoreToken);
    
    // Fetch image data
    const image = await fetchImageById(imageId);
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
      restoreSession(imageIdFromUrl);
      return;
    }

    // Priority 2: Last active session from cache
    const lastActiveId = EditorCache.getLastActiveImageId();
    if (lastActiveId) {
      console.log('[EditorPage] Found last active session, restoring...');
      restoreSession(lastActiveId);
    }
  }, [uploadedImage, imageIdFromUrl]);

  // Save state to cache using refs for latest values
  const saveToCacheFromRefs = useCallback(() => {
    const image = uploadedImageRef.current;
    if (!image) return;
    
    // Cancel any pending debounced saves to prevent stale data from overwriting
    debouncedSaveRef.current.cancel();
    
    EditorCache.save(image.id, {
      edits: editsRef.current,
      currentBaseEditId: currentBaseEditIdRef.current,
      generateInputText: promptTextRef.current,
      overwriteLastSave: overwriteLastSaveRef.current,
    });
  }, []);

  // Create single debounced save instance
  const debouncedSaveRef = useRef(
    debounce(() => {
      const image = uploadedImageRef.current;
      if (!image) return;
      
      EditorCache.save(image.id, {
        edits: editsRef.current,
        currentBaseEditId: currentBaseEditIdRef.current,
        generateInputText: promptTextRef.current,
        overwriteLastSave: overwriteLastSaveRef.current,
      });
    }, 500)
  );

  // Save to cache immediately when edits, base, or overwrite changes (not debounced)
  useEffect(() => {
    if (uploadedImage) {
      saveToCacheFromRefs();
    }
  }, [edits, currentBaseEditId, overwriteLastSave, uploadedImage, saveToCacheFromRefs]);

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
        provider: apiProvider,
      };
      
      if (currentBaseEditId !== null) {
        requestBody.baseEditId = currentBaseEditId;
        console.log('Using edit as base:', currentBaseEditId);
      }
      
      response = await apiRequest("POST", "/api/edits", requestBody);

      if (!response.ok) {
        // Try to parse error response
        const errorData = await response.json();
        if (errorData?.message) {
          throw new Error(errorData.message);
        }
        throw new Error("Failed to generate edit");
      }

      const edit: Edit = await response.json();
      
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

  // Handle suggestion click - append to prompt
  const handleSuggestionSelect = (suggestionText: string) => {
    const newText = promptText.trim()
      ? `${promptText} ${suggestionText}`
      : suggestionText;
    setPromptText(newText);
    debouncedSaveRef.current();
    console.log('[EditorPage] Suggestion selected:', suggestionText);
  };

  // Build combined history array with original image first
  const historyItems: HistoryItem[] = uploadedImage ? [
    {
      id: `original-${uploadedImage.id}`,
      resultUrl: uploadedImage.originalUrl,
      prompt: 'Original',
      createdAt: uploadedImage.createdAt,
      isSaved: false,
      isOriginal: true,
    },
    ...edits.map(edit => ({
      id: edit.id,
      resultUrl: edit.resultUrl,
      prompt: edit.prompt,
      createdAt: edit.createdAt,
      isSaved: edit.isSaved,
      isOriginal: false,
    }))
  ] : [];

  if (!uploadedImage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Start Editing</h1>
            <p className="text-lg text-muted-foreground">
              Upload an image to begin your AI-powered transformation
            </p>
          </div>
          <div className="flex justify-center">
            <ObjectUploader
              maxNumberOfFiles={1}
              maxFileSize={20 * 1024 * 1024}
              onGetUploadParameters={handleGetUploadParameters}
              onComplete={handleUploadComplete}
              buttonClassName="h-72 w-full max-w-2xl border-2 border-dashed rounded-lg hover-elevate active-elevate-2 transition-all duration-200"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                  <UploadIcon className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-xl font-semibold">Click to upload an image</p>
                  <p className="text-sm text-muted-foreground">
                    Supports JPEG, PNG, WebP (max 20MB)
                  </p>
                </div>
              </div>
            </ObjectUploader>
          </div>
        </div>
      </div>
    );
  }

  return isMobile ? (
    // MOBILE LAYOUT
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile Header with Hamburger Menu */}
      <header className="flex justify-between items-center p-4 border-b bg-background sticky top-0 z-10">
        <h1 className="text-lg font-bold">Photo Editor</h1>
        <button
          onClick={() => setShowMenu(true)}
          className="p-2 hover-elevate active-elevate-2 rounded-lg"
          aria-label="Open menu"
          data-testid="button-menu-mobile"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* Image Preview */}
        <div className="mb-4 relative">
          {showComparison ? (
            (() => {
              const baseEdit = currentBaseEditId !== null 
                ? edits.find(e => e.id === currentBaseEditId)
                : null;
              const baseImageUrl = baseEdit?.resultUrl || uploadedImage.originalUrl;
              const isUsingBase = currentBaseEditId !== null && baseEdit !== undefined;
              
              return (
                <div className="rounded-lg overflow-hidden shadow-lg">
                  <BeforeAfterSlider
                    beforeImage={baseImageUrl}
                    afterImage={uploadedImage.currentUrl}
                    beforeLabel={isUsingBase ? "Base" : "Original"}
                    afterLabel="Edited"
                    afterPrompt={edits.length > 0 ? edits[0]?.prompt : undefined}
                  />
                </div>
              );
            })()
          ) : (
            <img
              src={uploadedImage.currentUrl}
              alt="Editor preview"
              className="w-full h-auto rounded-lg shadow-lg"
              data-testid="img-editor-preview"
            />
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <ProcessingIndicator progress={65} />
            </div>
          )}
        </div>

        {/* Prompt Field - ABOVE Provider */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Describe Your Edit</label>
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
          <p className="text-xs text-muted-foreground mt-1">
            Press Enter to generate, Shift + Enter for new line
          </p>
        </div>

        {/* AI Provider Dropdown - BELOW Prompt */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">AI Provider</label>
          <Select 
            value={apiProvider} 
            onValueChange={(value: "huggingface" | "gemini") => setApiProvider(value)}
            data-testid="select-provider-mobile"
          >
            <SelectTrigger className="w-full" data-testid="trigger-provider-mobile">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini" data-testid="option-gemini-mobile">
                Gemini 2.5 Flash Image (Recommended)
              </SelectItem>
              <SelectItem value="huggingface" data-testid="option-huggingface-mobile">
                HuggingFace
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => handlePromptSubmit(promptText)}
          disabled={isProcessing || !promptText.trim()}
          className="w-full mb-3"
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
        />
      )}
    </div>
  ) : (
    // DESKTOP AND MEDIUM SCREEN LAYOUT
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Left Sidebar - Edit History (Desktop Only >= 1024px) */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 h-[calc(100vh-2rem)]">
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
        <div className="flex flex-col gap-6">
          {/* Top Actions with Hamburger Menu for Medium Screens */}
          <div className="flex gap-3">
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
            <Button variant="ghost" onClick={handleReset} data-testid="button-reset" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Upload Different Image
            </Button>
            <Button variant="outline" onClick={handleNewProject} data-testid="button-new-project">
              New Project
            </Button>
          </div>

          {/* Editor Area - Image and Control Panel Side by Side */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            {/* Image Preview */}
            <div className="flex justify-center items-start">
              <div className="relative w-full max-w-[450px] lg:max-w-[600px] 2xl:max-w-[750px]">
                {showComparison ? (
                  (() => {
                    const baseEdit = currentBaseEditId !== null 
                      ? edits.find(e => e.id === currentBaseEditId)
                      : null;
                    const baseImageUrl = baseEdit?.resultUrl || uploadedImage.originalUrl;
                    const isUsingBase = currentBaseEditId !== null && baseEdit !== undefined;
                    
                    return (
                      <div className="rounded-lg overflow-hidden shadow-lg">
                        <BeforeAfterSlider
                          beforeImage={baseImageUrl}
                          afterImage={uploadedImage.currentUrl}
                          beforeLabel={isUsingBase ? "Base" : "Original"}
                          afterLabel="Edited"
                          afterPrompt={edits.length > 0 ? edits[0]?.prompt : undefined}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <ImageCanvas imageUrl={uploadedImage.currentUrl} />
                )}
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <ProcessingIndicator progress={65} />
                  </div>
                )}
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex flex-col gap-4">
              {/* Prompt Field - FULL WIDTH, ABOVE AI Provider */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Describe Your Edit
                </label>
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
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific for best results • Press Enter to generate, Shift + Enter for new line
                </p>
              </div>

              {/* AI Provider Dropdown - BELOW Prompt */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  AI Provider
                </label>
                <Select 
                  value={apiProvider} 
                  onValueChange={(value: "huggingface" | "gemini") => setApiProvider(value)}
                  data-testid="select-provider"
                >
                  <SelectTrigger className="w-full" data-testid="trigger-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini" data-testid="option-gemini">
                      Gemini 2.5 Flash Image (Recommended)
                    </SelectItem>
                    <SelectItem value="huggingface" data-testid="option-huggingface">
                      HuggingFace
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => handlePromptSubmit(promptText)}
                disabled={isProcessing || !promptText.trim()}
                className="w-full"
                size="lg"
                data-testid="button-generate"
              >
                {isProcessing ? 'Generating...' : 'Generate'}
              </Button>

              {/* Quick Suggestions - COMPACT VERSION */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Quick Suggestions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {mockSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionSelect(suggestion.prompt)}
                      className="p-3 text-left rounded-lg border hover-elevate active-elevate-2 transition-all group"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
