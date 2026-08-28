import { Check, Image as ImageIcon, Sparkles, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";

const copy = {
  en: {
    title: "PhotoAI Editor",
    ready: "Ready",
    editorNavigation: "Editor navigation preview",
    editor: "Image editor",
    gallery: "Gallery",
    portrait: "Golden hour portrait",
    comparison: "Before / after preview",
    version: "Version 03",
    afterAlt: "AI-edited portrait with a cinematic creature and fiery lighting",
    beforeAlt: "Original portrait before the AI edit",
    before: "Before",
    after: "After",
    historyLabel: "Editing history preview",
    history: ["Original", "Warm light", "Soft contrast"],
    promptLabel: "AI prompt preview",
    edit: "AI edit",
    prompt: "Make the light warmer, add a soft sunset glow and keep the face natural.",
    tags: ["Natural face", "Warm light"],
    apply: "Apply AI edit",
    poweredBy: "Powered by Nano Banana",
  },
  ru: {
    title: "Редактор PhotoAI",
    ready: "Готово",
    editorNavigation: "Предпросмотр навигации редактора",
    editor: "Редактор",
    gallery: "Галерея",
    portrait: "Портрет в золотом свете",
    comparison: "Сравнение до и после",
    version: "Версия 03",
    afterAlt: "Обработанный AI портрет с фантастическим существом и огненным светом",
    beforeAlt: "Исходный портрет до AI-обработки",
    before: "До",
    after: "После",
    historyLabel: "Предпросмотр истории редактирования",
    history: ["Оригинал", "Тёплый свет", "Мягкий контраст"],
    promptLabel: "Предпросмотр AI-промпта",
    edit: "AI-редактирование",
    prompt: "Сделай свет теплее, добавь мягкое закатное сияние и сохрани естественные черты лица.",
    tags: ["Естественное лицо", "Тёплый свет"],
    apply: "Применить AI-эффект",
    poweredBy: "Работает на Nano Banana",
  },
};

export function LandingEditorPreview() {
  const { locale } = useLocale();
  const text = copy[locale];

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="orange-glow absolute -inset-x-10 -inset-y-20 -z-10 blur-2xl" />

      <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl">
        <div className="flex h-11 items-center justify-between border-b bg-muted/40 px-3 sm:px-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/35" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground sm:text-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {text.title}
          </div>
          <Badge variant="secondary" className="gap-1 border border-border bg-background/80">
            <Check className="h-3 w-3 text-primary" />
            {text.ready}
          </Badge>
        </div>

        <div className="grid min-h-[25rem] lg:grid-cols-[11rem_1fr_18rem]">
          <aside className="hidden border-r bg-muted/25 p-3 lg:block" aria-label={text.editorNavigation}>
            <div className="mb-5 flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              PhotoAI
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 font-medium text-primary">
                <WandSparkles className="h-3.5 w-3.5" />
                {text.editor}
              </div>
              <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                {text.gallery}
              </div>
            </div>
          </aside>

          <div className="flex min-h-[24rem] min-w-0 flex-col bg-muted/20 p-3 sm:p-5 lg:min-h-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{text.portrait}</p>
                <p className="text-xs text-muted-foreground">{text.comparison}</p>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">{text.version}</Badge>
            </div>

            <div className="relative min-h-80 flex-1 overflow-hidden rounded-lg border bg-background shadow-sm sm:min-h-[32rem]">
              <img
                src="/landing-after.jpg"
                alt={text.afterAlt}
                width={955}
                height={1273}
                className="absolute inset-0 h-full w-full object-cover object-[center_12%]"
                decoding="async"
              />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: "inset(0 65% 0 0)" }}>
                <img
                  src="/landing-before.jpg"
                  alt={text.beforeAlt}
                  width={955}
                  height={1273}
                  className="h-full w-full object-cover object-[center_12%]"
                  decoding="async"
                />
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm backdrop-blur-sm sm:text-xs">
                {text.before}
              </span>
              <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground shadow-sm sm:text-xs">
                {text.after}
              </span>

              <div className="absolute inset-y-0 left-[35%] w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.14)]" />
              <div className="absolute left-[35%] top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-background/95 shadow-md">
                <span className="h-3 w-px bg-border" />
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-hidden" aria-label={text.historyLabel}>
              {text.history.map((label, index) => (
                <div
                  key={label}
                  className={`min-w-0 flex-1 rounded-md border px-2.5 py-2 text-[10px] sm:text-xs ${
                    index === 2 ? "border-primary/40 bg-primary/10 text-foreground" : "bg-background text-muted-foreground"
                  }`}
                >
                  <span className="block truncate">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="border-t bg-card p-4 lg:border-l lg:border-t-0" aria-label={text.promptLabel}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">{text.edit}</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              {text.prompt}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {text.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
            </div>
            <div className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-primary-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs">
              <WandSparkles className="h-4 w-4" />
              {text.apply}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">{text.poweredBy}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
