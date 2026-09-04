import { Check, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumPaywall } from "@/contexts/PremiumPaywallContext";
import { PREMIUM_PLAN } from "@/lib/premiumExperience";
import { cn } from "@/lib/utils";

export function PremiumPlanCard({ className }: { className?: string }) {
  const { locale } = useLocale();
  const { openPaywall } = usePremiumPaywall();
  const isRussian = locale === "ru";
  const formattedPrice = new Intl.NumberFormat(isRussian ? "ru-RU" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(PREMIUM_PLAN.monthlyPriceUsd);
  const features = isRussian
    ? ["100 AI-генераций каждый месяц", "Скачивание в высоком разрешении", "Дополнительные коллекции промптов"]
    : [...PREMIUM_PLAN.features];

  return (
    <Card className={cn("relative overflow-hidden border-primary/25 p-6 shadow-lg sm:p-8", className)}>
      <div className="absolute right-0 top-0 h-44 w-44 -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative">
        <Badge className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Premium
        </Badge>
        <h2 className="mt-5 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          {isRussian ? "Больше идей. Больше готовых изображений." : "More Ideas. More Finished Images."}
        </h2>
        <p className="mt-3 max-w-xl text-pretty leading-7 text-muted-foreground">
          {isRussian ? "Расширенный тариф для тех, кто регулярно создаёт и сохраняет новые версии." : "A focused plan for creators who generate, refine, and save images regularly."}
        </p>
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight tabular-nums">{formattedPrice}</span>
          <span className="text-sm text-muted-foreground">{isRussian ? "/ месяц" : "/ month"}</span>
        </div>
        <ul className="mt-6 grid gap-3" aria-label={isRussian ? "Возможности Premium" : "Premium features"}>
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        <Button className="mt-7 w-full sm:w-auto" size="lg" onClick={() => openPaywall("pricing")} data-testid="button-pricing-subscribe">
          {isRussian ? "Посмотреть Premium" : "View Premium"}
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {isRussian ? "Демонстрация оплаты: списаний и изменения тарифа не будет." : "Payment preview only. No charge or plan change will occur."}
        </p>
      </div>
    </Card>
  );
}
