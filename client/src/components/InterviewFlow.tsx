import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface InterviewFlowProps {
  onComplete: (preferences: {
    editingStyle: string;
    useCases: string[];
    skillLevel: string;
    favoriteEffects: string[];
  }) => void;
}

export default function InterviewFlow({ onComplete }: InterviewFlowProps) {
  const [step, setStep] = useState(0);
  const [editingStyle, setEditingStyle] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [favoriteEffects, setFavoriteEffects] = useState<string[]>([]);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const steps = [
    {
      title: "Your vibe?",
      explanation: "Tells the AI: chill tweaks or full send?",
      options: [
        { value: "natural", label: "Natural", description: "AI keeps it real. Minor touch-ups." },
        { value: "dramatic", label: "Bold", description: "AI cranks it up. Eye-popping edits." },
        { value: "artistic", label: "Artistic", description: "Let AI cook. Expect wild results." },
      ],
      value: editingStyle,
      multiSelect: false,
    },
    {
      title: "Pic goals?",
      explanation: "Get relevant prompts for your goals.",
      options: [
        { value: "social", label: "Socials", description: "Vibrant, scroll-stopping content." },
        { value: "professional", label: "Pro Stuff", description: "Clean edits for portfolio or clients." },
        { value: "personal", label: "For Fun", description: "Your hobby, your rules. Go wild." },
        { value: "ecommerce", label: "E-com", description: "Product shots. Clean backgrounds, good light." },
      ],
      value: useCases,
      multiSelect: true,
    },
    {
      title: "Skill level?",
      explanation: "We'll tweak the UI. Easy or Pro?",
      options: [
        { value: "beginner", label: "Beginner", description: "Simple prompts, zero stress." },
        { value: "intermediate", label: "Intermediate", description: "Balanced UI, useful tips." },
        { value: "advanced", label: "Advanced", description: "Full control. All the tech specs." },
      ],
      value: skillLevel,
      multiSelect: false,
    },
    {
      title: "Go-to effects?",
      explanation: "Your faves appear first. Save time.",
      options: [
        { value: "lighting", label: "Lighting", description: "Golden hour, epic skies, shadows." },
        { value: "color", label: "Color", description: "Warm tones, saturation, color shifts." },
        { value: "filters", label: "Filters", description: "Vintage, B&W, cinematic." },
        { value: "effects", label: "FX", description: "Blur, sharpen, glitch filters." },
      ],
      value: favoriteEffects,
      multiSelect: true,
    },
  ];

  const currentStep = steps[step];

  const handleSelect = (value: string) => {
    if (step === 0) {
      setEditingStyle(value);
    } else if (step === 1) {
      setUseCases((current) => (
        current.includes(value)
          ? current.filter((selectedValue) => selectedValue !== value)
          : [...current, value]
      ));
    } else if (step === 2) {
      setSkillLevel(value);
    } else {
      setFavoriteEffects((current) => (
        current.includes(value)
          ? current.filter((selectedValue) => selectedValue !== value)
          : [...current, value]
      ));
    }
  };

  const canProceed = currentStep.multiSelect
    ? (currentStep.value as string[]).length > 0
    : currentStep.value !== "";

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((current) => current + 1);
      return;
    }

    onComplete({
      editingStyle,
      useCases,
      skillLevel,
      favoriteEffects,
    });
  };

  return (
    <Card className="mx-auto w-full max-w-3xl border-border/80 bg-card/95 p-5 shadow-xl backdrop-blur sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Tune your AI</p>
          <p className="mt-1 text-xs text-muted-foreground">A quick setup for better starting suggestions</p>
        </div>
        <span className="shrink-0 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          {step + 1} / {totalSteps}
        </span>
      </div>
      <Progress value={progress} className="mt-5" aria-label="Onboarding progress" />

      <div className="mt-9" aria-live="polite">
        <p className="text-sm font-medium text-primary">Step {step + 1}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{currentStep.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground" data-testid="text-explanation">
          {currentStep.explanation}
        </p>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentStep.options.map((option) => {
            const isSelected = currentStep.multiSelect
              ? (currentStep.value as string[]).includes(option.value)
              : currentStep.value === option.value;

            return (
              <button
                type="button"
                key={option.value}
                className={cn(
                  "group min-h-32 rounded-lg border bg-background p-5 text-left shadow-2xs transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isSelected && "border-primary/50 bg-primary/10 ring-1 ring-primary/30",
                )}
                onClick={() => handleSelect(option.value)}
                aria-pressed={isSelected}
                data-testid={"option-" + option.value}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block font-semibold">{option.label}</span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">{option.description}</span>
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-transparent transition-colors",
                      isSelected && "border-primary bg-primary text-primary-foreground",
                    )}
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-5">
        <Button
          variant="ghost"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
          data-testid="button-back"
        >
          <ArrowLeft />
          Back
        </Button>
        <Button onClick={handleNext} disabled={!canProceed} data-testid="button-next">
          {step === totalSteps - 1 ? (
            <>
              <CheckCircle2 />
              Done
            </>
          ) : (
            <>
              Next
              <ArrowRight />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
