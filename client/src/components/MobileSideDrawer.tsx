import { useEffect } from "react";
import { FolderPlus, History, Upload, X } from "lucide-react";
import type { HistoryItem } from "@/components/EditHistory";
import EditHistoryItem from "@/components/EditHistoryItem";
import { Button } from "@/components/ui/button";

interface MobileSideDrawerProps {
  onClose: () => void;
  historyItems: HistoryItem[];
  onUploadNew: () => void;
  onNewProject: () => void;
  onUseAsBase: (editId: number | string) => void;
  onSave?: (editId: number) => void;
  activeItemId?: number | string;
  currentBaseId?: number | null;
}

export default function MobileSideDrawer({ 
  onClose, 
  historyItems, 
  onUploadNew, 
  onNewProject,
  onUseAsBase,
  onSave,
  activeItemId,
  currentBaseId
}: MobileSideDrawerProps) {
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 animate-in bg-black/60 backdrop-blur-[2px] fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Side Drawer */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] animate-in border-l bg-background shadow-2xl slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Editing tools and history"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/20 p-4">
          <div>
            <h3 className="text-base font-semibold">Editing tools</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Project actions and history</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onClose}
            aria-label="Close menu"
            data-testid="button-close-menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="h-[calc(100svh-73px)] overflow-y-auto">
          {/* Action Buttons */}
          <div className="space-y-2 border-b p-4">
            <Button
              onClick={() => {
                onUploadNew();
                onClose();
              }}
              className="w-full"
              data-testid="button-upload-different"
            >
              <Upload className="h-4 w-4" />
              Upload Different Image
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="w-full"
              data-testid="button-new-project-mobile"
            >
              <FolderPlus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Edit History */}
          <div className="p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4 text-primary" />
              Edit History
            </h4>
            <div className="space-y-3">
              {historyItems.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-8 text-center">
                  <History className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 text-sm font-medium">No edits yet</p>
                </div>
              ) : (
                historyItems.map((item) => {
                  const isBase = item.isOriginal 
                    ? currentBaseId === null 
                    : currentBaseId === item.id;
                  
                  return (
                    <EditHistoryItem
                      key={item.id}
                      item={item}
                      isActive={item.id === activeItemId}
                      isBase={isBase}
                      onSave={typeof item.id === 'number' && onSave ? () => onSave(item.id as number) : undefined}
                      onUseAsBase={() => onUseAsBase(item.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
