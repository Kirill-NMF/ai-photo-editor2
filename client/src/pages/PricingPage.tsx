import { Badge } from "@/components/ui/badge";
import { PremiumPlanCard } from "@/components/PremiumPlanCard";
import { useLocale } from "@/contexts/LocaleContext";
import { CreditCard } from "lucide-react";

export default function PricingPage() {
  const { locale } = useLocale();
  const isRussian = locale === "ru";

  return (
    <div className="bg-background">
      <div className="site-container max-w-4xl py-8 sm:py-10 lg:py-12">
        <div className="mb-8 border-b pb-8 text-center">
          <Badge variant="outline" className="mb-4 gap-2 bg-muted/30">
            <CreditCard className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {isRussian ? "Тарифы" : "Pricing"}
          </Badge>
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {isRussian ? "Простой тариф для регулярного творчества" : "One Simple Plan for More Creative Work"}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty leading-7 text-muted-foreground">
            {isRussian ? "Бесплатный тариф включает 11 генераций. Premium расширяет лимит и открывает дополнительные инструменты." : "The free plan includes 11 generations. Premium raises the limit and unlocks additional tools."}
          </p>
        </div>
        <PremiumPlanCard />
      </div>
    </div>
  );
}
