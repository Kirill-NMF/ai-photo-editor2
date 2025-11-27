import { useEffect } from "react";
import { X } from "lucide-react";
import type { HistoryItem } from "@/components/EditHistory";

interface MobileSideDrawerProps {
  onClose: () => void;
  historyItems: HistoryItem[];
  onUploadNew: () => void;
  onNewProject: () => void;
  onUseAsBase?: (editId: number) => void;
}

export default function MobileSideDrawer({ 
  onClose, 
  historyItems, 
  onUploadNew, 
  onNewProject,
  onUseAsBase 
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
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Side Drawer */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-background z-50 shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Menu</h3>
          <button
            onClick={onClose}
            className="p-2 hover-elevate active-elevate-2 rounded-lg"
            aria-label="Close menu"
            data-testid="button-close-menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {/* Action Buttons */}
          <div className="p-4 space-y-2 border-b">
            <button
              onClick={() => {
                onUploadNew();
                onClose();
              }}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover-elevate active-elevate-2 transition-colors"
              data-testid="button-upload-different"
            >
              Upload Different Image
            </button>
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="w-full py-3 px-4 border-2 border-primary text-primary rounded-lg font-semibold hover-elevate active-elevate-2 transition-colors"
              data-testid="button-new-project-mobile"
            >
              New Project
            </button>
          </div>

          {/* Edit History */}
          <div className="p-4">
            <h4 className="font-semibold mb-3">Edit History</h4>
            <div className="space-y-2">
              {historyItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No edits yet
                </p>
              ) : (
                historyItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onUseAsBase && typeof item.id === 'number') {
                        onUseAsBase(item.id);
                      }
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover-elevate active-elevate-2 transition-colors"
                    data-testid={`button-history-${item.id}`}
                  >
                    <img
                      src={item.resultUrl}
                      alt="Edit preview"
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium line-clamp-2">
                        {item.prompt || "No prompt"}
                      </p>
                      {item.isSaved && (
                        <span className="text-xs text-primary">Saved</span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
