import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, LockKeyhole, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocale } from "@/contexts/LocaleContext";
import { PREMIUM_PLAN, type PaywallTrigger } from "@/lib/premiumExperience";

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: PaywallTrigger;
}

const triggerCopy = {
  en: {
    limit: "You’ve used all 11 free generations. Upgrade to keep creating.",
    download: "High-resolution downloads are available with Premium.",
    presets: "Unlock every curated prompt collection and create faster.",
    pricing: "Get more generations, downloads, and creative starting points.",
  },
  ru: {
    limit: "Вы использовали все 11 бесплатных генераций. Подключите Premium, чтобы продолжить.",
    download: "Скачивание в высоком разрешении доступно с Premium.",
    presets: "Откройте все готовые коллекции промптов и создавайте быстрее.",
    pricing: "Получите больше генераций, скачивание и новые творческие идеи.",
  },
};

export function PremiumPaywall({ isOpen, onClose, trigger }: PremiumPaywallProps) {
  const { locale } = useLocale();
  const [step, setStep] = useState<"offer" | "payment" | "soon">("offer");
  const isRussian = locale === "ru";
  const formattedPrice = useMemo(
    () => new Intl.NumberFormat(isRussian ? "ru-RU" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(PREMIUM_PLAN.monthlyPriceUsd),
    [isRussian],
  );

  useEffect(() => {
    if (!isOpen) setStep("offer");
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[calc(100svh-1rem)] max-w-lg gap-0 overscroll-contain overflow-y-auto p-0 sm:rounded-xl"
        data-testid="modal-premium-paywall"
      >
        <div className="relative overflow-hidden border-b bg-primary/[0.045] px-6 pb-6 pt-7 sm:px-8">
          <div className="absolute right-0 top-0 h-36 w-36 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/15 blur-3xl" />
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Premium
          </span>
          <DialogHeader className="relative mt-4 text-left">
            <DialogTitle className="text-balance text-2xl leading-tight sm:text-3xl">
              {isRussian ? "Больше возможностей с PhotoAI" : "Create More With PhotoAI"}
            </DialogTitle>
            <DialogDescription className="max-w-md pt-1 leading-6">
              {triggerCopy[locale][trigger]}
            </DialogDescription>
          </DialogHeader>
          <div className="relative mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight tabular-nums">{formattedPrice}</span>
            <span className="text-sm text-muted-foreground">{isRussian ? "/ месяц" : "/ month"}</span>
          </div>
        </div>

        <div className="space-y-3 px-6 py-6 sm:px-8">
          {[
            isRussian ? "100 AI-генераций каждый месяц" : PREMIUM_PLAN.features[0],
            isRussian ? "Скачивание в высоком разрешении" : PREMIUM_PLAN.features[1],
            isRussian ? "Дополнительные коллекции промптов" : PREMIUM_PLAN.features[2],
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="border-t px-6 py-5 sm:px-8">
          {step === "offer" && (
            <Button className="w-full" size="lg" onClick={() => setStep("payment")} data-testid="button-premium-subscribe">
              <LockKeyhole aria-hidden="true" />
              {isRussian ? `Подключить за ${formattedPrice}` : `Subscribe for ${formattedPrice}`}
            </Button>
          )}

          {step === "payment" && (
            <div className="grid gap-2 sm:grid-cols-2" data-testid="premium-payment-options">
              <Button variant="outline" size="lg" onClick={() => setStep("soon")}>
                <CreditCard aria-hidden="true" />
                {isRussian ? "Банковская карта" : "Pay With Card"}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setStep("soon")}>
                <span className="font-semibold" translate="no">Stripe</span>
              </Button>
            </div>
          )}

          {step === "soon" && (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4 text-center" role="status" aria-live="polite" data-testid="premium-coming-soon">
              <p className="font-semibold">{isRussian ? "Оплата скоро появится" : "Payments Are Coming Soon"}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {isRussian ? "Это демонстрация: списания не было, а тариф не изменился." : "This is a preview. You were not charged and your plan has not changed."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
