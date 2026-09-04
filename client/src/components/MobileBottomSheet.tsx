import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PromptSuggestions from "@/components/PromptSuggestions";

interface MobileBottomSheetProps {
  onClose: () => void;
  onSelect: (prompt: string) => void;
  onUnlockPremium: () => void;
}

export default function MobileBottomSheet({ onClose, onSelect, onUnlockPremium }: MobileBottomSheetProps) {
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
      <button
        type="button"
        aria-label="Close suggestions"
        className="fixed inset-0 z-40 animate-in bg-black/60 backdrop-blur-[2px] fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <section
        className="fixed inset-x-0 bottom-0 z-50 animate-in rounded-t-xl border-t bg-background shadow-2xl slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Prompt preset collections"
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
              Prompt Presets
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Choose a collection and a starting prompt</p>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={onClose} aria-label="Close suggestions">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Suggestions List */}
        <div className="max-h-[70vh] overscroll-contain overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <PromptSuggestions onSelect={onSelect} onUnlockPremium={onUnlockPremium} showHeading={false} />
        </div>
      </section>
    </>
  );
}
