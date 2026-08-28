import { Check, Image as ImageIcon, Sparkles, WandSparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function LandingEditorPreview() {
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
            PhotoAI Editor
          </div>
          <Badge variant="secondary" className="gap-1 border border-border bg-background/80">
            <Check className="h-3 w-3 text-primary" />
            Ready
          </Badge>
        </div>

        <div className="grid min-h-[25rem] lg:grid-cols-[11rem_1fr_18rem]">
          <aside className="hidden border-r bg-muted/25 p-3 lg:block" aria-label="Editor navigation preview">
            <div className="mb-5 flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              PhotoAI
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-2 font-medium text-primary">
                <WandSparkles className="h-3.5 w-3.5" />
                Image editor
              </div>
              <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                Gallery
              </div>
            </div>
          </aside>

          <div className="flex min-h-[24rem] min-w-0 flex-col bg-muted/20 p-3 sm:p-5 lg:min-h-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Golden hour portrait</p>
                <p className="text-xs text-muted-foreground">Before / after preview</p>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">Version 03</Badge>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-lg border bg-background shadow-sm">
              <div className="absolute inset-0 grid grid-cols-2">
                <div className="relative overflow-hidden bg-[linear-gradient(165deg,#cbd5e1_0%,#94a3b8_43%,#334155_44%,#64748b_66%,#1e293b_67%)]">
                  <div className="absolute bottom-[24%] left-[16%] h-[38%] w-[32%] rounded-[45%_45%_30%_30%] bg-slate-700/80 shadow-xl" />
                  <div className="absolute bottom-[53%] left-[23%] h-[16%] w-[17%] rounded-full bg-slate-600" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white sm:text-xs">
                    Before
                  </span>
                </div>
                <div className="relative overflow-hidden bg-[linear-gradient(165deg,#ffedd5_0%,#fb923c_42%,#9a3412_43%,#431407_68%,#1c1917_69%)]">
                  <div className="absolute -right-[15%] top-[8%] h-[42%] w-[55%] rounded-full bg-amber-200/50 blur-2xl" />
                  <div className="absolute bottom-[24%] left-[16%] h-[38%] w-[32%] rounded-[45%_45%_30%_30%] bg-orange-950/80 shadow-xl" />
                  <div className="absolute bottom-[53%] left-[23%] h-[16%] w-[17%] rounded-full bg-amber-950" />
                  <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-medium text-primary-foreground sm:text-xs">
                    After
                  </span>
                </div>
              </div>
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
              <div className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-background/90 shadow-md">
                <span className="h-3 w-px bg-border" />
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-hidden" aria-label="Editing history preview">
              {["Original", "Warm light", "Soft contrast"].map((label, index) => (
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

          <aside className="border-t bg-card p-4 lg:border-l lg:border-t-0" aria-label="AI prompt preview">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">AI edit</p>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              Make the light warmer, add a soft sunset glow and keep the face natural.
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary">Natural face</Badge>
              <Badge variant="secondary">Warm light</Badge>
            </div>
            <div className="mt-5 flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-primary-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs">
              <WandSparkles className="h-4 w-4" />
              Apply AI edit
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">Powered by Nano Banana</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
