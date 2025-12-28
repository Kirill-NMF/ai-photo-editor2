import { useEffect } from "react";

interface MobileBottomSheetProps {
  onClose: () => void;
  suggestions: Array<{ id: number; prompt: string; category: string }>;
  onSelect: (prompt: string) => void;
}

export default function MobileBottomSheet({ onClose, suggestions, onSelect }: MobileBottomSheetProps) {
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
      
      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b">
          <h3 className="text-lg font-semibold">Quick Suggestions</h3>
        </div>

        {/* Suggestions List */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion.prompt)}
                className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-all active:scale-95"
                data-testid={`button-suggestion-${suggestion.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium">{suggestion.prompt}</p>
                  <p className="text-sm text-muted-foreground mt-1 capitalize">{suggestion.category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
