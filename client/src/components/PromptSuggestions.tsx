import { type KeyboardEvent, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LockKeyhole, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { PROMPT_PACKS, type PromptPack } from "@/lib/premiumExperience";
import { cn } from "@/lib/utils";

interface PromptSuggestionsProps {
  onSelect: (prompt: string) => void;
  onUnlockPremium: () => void;
  showHeading?: boolean;
}

export default function PromptSuggestions({ onSelect, onUnlockPremium, showHeading = true }: PromptSuggestionsProps) {
  const { locale } = useLocale();
  const [activePackId, setActivePackId] = useState<PromptPack["id"]>("quick");
  const trackRef = useRef<HTMLDivElement>(null);
  const activePack = PROMPT_PACKS.find((pack) => pack.id === activePackId) ?? PROMPT_PACKS[0];
  const isRussian = locale === "ru";

  const scrollPacks = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
  };

  const handlePackKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = PROMPT_PACKS.length - 1;
    const nextIndex = event.key === "ArrowRight"
      ? (index === lastIndex ? 0 : index + 1)
      : event.key === "ArrowLeft"
        ? (index === 0 ? lastIndex : index - 1)
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? lastIndex
            : null;

    if (nextIndex === null) return;
    event.preventDefault();
    setActivePackId(PROMPT_PACKS[nextIndex].id);
    trackRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]?.focus();
  };

  return (
    <section className="min-w-0" aria-labelledby={showHeading ? "prompt-suggestions-title" : undefined}>
      <div className={cn("mb-3 flex items-end gap-3", showHeading ? "justify-between" : "justify-end")}>
        {showHeading && <div>
          <h3 id="prompt-suggestions-title" className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            {isRussian ? "Готовые идеи" : "Prompt Presets"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRussian ? "Выберите коллекцию" : "Choose a collection"}
          </p>
        </div>}
        <div className="flex gap-1 md:hidden">
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => scrollPacks(-1)} aria-label={isRussian ? "Предыдущие коллекции" : "Previous collections"}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-11 w-11" onClick={() => scrollPacks(1)} aria-label={isRussian ? "Следующие коллекции" : "Next collections"}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div
        ref={trackRef}
        role="tablist"
        aria-label={isRussian ? "Коллекции промптов" : "Prompt collections"}
        className="flex max-w-full snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible"
      >
        {PROMPT_PACKS.map((pack, index) => (
          <button
            key={pack.id}
            type="button"
            role="tab"
            id={`prompt-pack-tab-${pack.id}`}
            aria-selected={activePack.id === pack.id}
            aria-controls="prompt-suggestion-panel"
            tabIndex={activePack.id === pack.id ? 0 : -1}
            onClick={() => setActivePackId(pack.id)}
            onKeyDown={(event) => handlePackKeyDown(event, index)}
            className={cn(
              "flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-full border bg-background px-3 py-2 text-xs font-medium touch-manipulation transition-[border-color,background-color,color] hover:border-primary/40 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activePack.id === pack.id && "border-primary/50 bg-primary/10 text-primary",
            )}
            data-testid={`prompt-pack-${pack.id}`}
          >
            <span>{pack.label}</span>
            {pack.isPremium && <LockKeyhole className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-label="Premium" />}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <h4 className="min-w-0 truncate text-sm font-semibold">{activePack.title}</h4>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {activePack.suggestions.length} {isRussian ? "примера" : "presets"}
        </span>
      </div>

      <div id="prompt-suggestion-panel" role="tabpanel" aria-labelledby={`prompt-pack-tab-${activePack.id}`} className="relative mt-2 min-h-52 min-w-0 overflow-hidden">
        <div className={cn("grid min-w-0 gap-2", activePack.isPremium && "select-none opacity-40 blur-[2px]")}>
          {activePack.suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={activePack.isPremium ? onUnlockPremium : () => onSelect(suggestion.prompt)}
              aria-label={activePack.isPremium ? `${suggestion.prompt}. Premium` : suggestion.prompt}
              className="group min-h-16 min-w-0 w-full overflow-hidden rounded-lg border bg-background p-3 text-left shadow-2xs touch-manipulation transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid={`suggestion-${suggestion.id}`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{suggestion.prompt}</p>
                  <p className="truncate text-xs text-muted-foreground">{suggestion.category}</p>
                </div>
                {activePack.isPremium && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300">
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {activePack.isPremium && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <div className="pointer-events-auto w-full max-w-xs rounded-xl border border-amber-500/25 bg-background/95 p-4 text-center shadow-xl backdrop-blur-sm">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-400/20 text-amber-700 dark:text-amber-300">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 font-semibold">{isRussian ? "Коллекция Premium" : "Premium Preset Pack"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isRussian ? "Посмотрите примеры и откройте все готовые промпты." : "Preview the ideas and unlock every ready-to-use prompt."}
              </p>
              <Button type="button" className="mt-3 w-full" onClick={onUnlockPremium} data-testid="button-unlock-preset-pack">
                {isRussian ? "Открыть Premium" : "Unlock Premium"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
