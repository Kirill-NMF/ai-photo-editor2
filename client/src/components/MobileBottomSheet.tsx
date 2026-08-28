import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        className="fixed inset-0 z-40 animate-in bg-black/60 backdrop-blur-[2px] fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <section
        className="fixed inset-x-0 bottom-0 z-50 animate-in rounded-t-xl border-t bg-background shadow-2xl slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Quick edit suggestions"
      >
        {/* Handle */}
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 pb-3">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" />
              Quick Suggestions
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Choose a starting prompt</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close suggestions">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions List */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="space-y-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onSelect(suggestion.prompt)}
                className="w-full rounded-lg border bg-background p-4 text-left shadow-2xs transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      </section>
    </>
  );
}
