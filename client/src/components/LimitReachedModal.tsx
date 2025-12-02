interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitReachedModal({ isOpen, onClose }: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="modal-limit-reached"
    >
      <div className="bg-card rounded-lg p-6 max-w-md mx-4 shadow-xl border">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 mt-2">
            Тестовый период закончен
          </h2>
          
          <p className="text-muted-foreground mb-6">
            К сожалению тестовый период закончен, для продления напишите Кириллу в Telegram
          </p>
          
          <a
            href="https://t.me/Kirill_NMF"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover-elevate active-elevate-2 transition mb-4 w-full"
            data-testid="button-telegram-link"
          >
            Написать в Telegram
          </a>
          
          <button
            onClick={onClose}
            className="block w-full text-muted-foreground hover:text-foreground mt-2"
            data-testid="button-close-modal"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
