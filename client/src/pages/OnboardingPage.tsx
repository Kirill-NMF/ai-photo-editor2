import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, WandSparkles } from "lucide-react";

import InterviewFlow from "@/components/InterviewFlow";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();

  const handleComplete = (preferences: unknown) => {
    console.log("Onboarding completed with preferences:", preferences);
    setLocation("/editor");
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-muted/20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_15%,hsl(var(--primary)/0.13),transparent_36%)]" />

      <div className="site-container py-8 sm:py-12">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          data-testid="button-back-home"
          className="-ml-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft />
          Back to Home
        </Button>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <section className="max-w-lg lg:sticky lg:top-28" aria-labelledby="onboarding-title">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <WandSparkles className="h-5 w-5" />
            </span>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-primary">Quick setup</p>
            <h1 id="onboarding-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Настройте PhotoAI под свой стиль
            </h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              Четыре коротких шага помогут расположить подходящие подсказки и эффекты ближе к вашему рабочему процессу.
            </p>
            <div className="mt-8 hidden items-center gap-3 rounded-lg border bg-background/70 p-4 text-sm text-muted-foreground sm:flex">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              Настройки можно будет изменить позже в аккаунте.
            </div>
          </section>

          <InterviewFlow onComplete={handleComplete} />
        </div>
      </div>
    </div>
  );
}
