interface PromoCodeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromoCodeSuccessModal({ isOpen, onClose }: PromoCodeSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="modal-promo-success"
    >
      <div className="bg-card rounded-lg p-6 max-w-md mx-4 shadow-xl border">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 mt-2">
            Спасибо за пряник!
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Теперь я сыт и могу служить дальше
          </p>
          
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover-elevate active-elevate-2 transition w-full"
            data-testid="button-continue"
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
}
