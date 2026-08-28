import { MessageCircle, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      data-testid="modal-limit-reached"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-reached-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border bg-card p-6 shadow-2xl sm:p-8">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.16),transparent_72%)]" />
        <div className="text-center">
          <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <h2 id="limit-reached-title" className="relative mb-3 mt-5 text-xl font-semibold">
            Тестовый период закончен
          </h2>
          
          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            К сожалению тестовый период закончен, для продления напишите Кириллу в Telegram
          </p>
          
          <Button asChild className="mb-3 w-full" data-testid="button-telegram-link">
            <a href="https://t.me/Kirill_NMF" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              Написать в Telegram
            </a>
          </Button>
          
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground"
            data-testid="button-close-modal"
          >
            <X className="h-4 w-4" />
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}
