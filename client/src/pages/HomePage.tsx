import { Link } from "wouter";
import {
  ArrowRight,
  Clock3,
  History,
  Image as ImageIcon,
  Layers3,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
  Zap,
} from "lucide-react";

import { LandingEditorPreview } from "@/components/LandingEditorPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { PremiumPlanCard } from "@/components/PremiumPlanCard";

const copy = {
  en: {
    badge: "Editing without complicated tools",
    heroStart: "Turn a simple prompt into a",
    heroAccent: " striking photo edit",
    heroDescription: "Upload an image, describe your idea in plain language, and let PhotoAI create the next version while preserving your editing history.",
    start: "Start editing",
    openEditor: "Open editor",
    howEyebrow: "How it works",
    howTitle: "From upload to finished edit in three clear steps",
    howDescription: "The workflow stays focused on the creative decision. PhotoAI takes care of the model request, versions, and project history around it.",
    steps: [
      { number: "01", icon: Upload, title: "Upload your image", description: "Choose a JPEG, PNG, or WebP file and keep the original safely available throughout the edit." },
      { number: "02", icon: WandSparkles, title: "Describe the change", description: "Write what you want in everyday language — from a warmer sky to a completely new visual mood." },
      { number: "03", icon: Zap, title: "Review and continue", description: "Compare the result, build on earlier versions, and save the edit you want to keep." },
    ],
    featuresEyebrow: "Built for iteration",
    featuresTitle: "Everything around the edit stays organized",
    featuresDescription: "A focused workspace for creating, comparing, and returning to the images that matter.",
    features: [
      { icon: Layers3, title: "Sequential editing", description: "Apply a series of transformations without losing the visual context of the previous result.", className: "md:col-span-2" },
      { icon: History, title: "Complete edit history", description: "Return to any earlier version and use it as the base for your next idea." },
      { icon: ImageIcon, title: "Personal gallery", description: "Keep projects organized and open them again when you are ready to continue." },
      { icon: Sparkles, title: "Prompt suggestions", description: "Start faster with practical editing ideas shaped for image-to-image workflows.", className: "md:col-span-2" },
    ],
    trustPoints: [
      { icon: ShieldCheck, title: "Private project files", description: "Originals stay behind authenticated access." },
      { icon: Clock3, title: "Fast workflow", description: "Move from prompt to a new version without a complex toolset." },
      { icon: Sparkles, title: "Nano Banana", description: "Image edits run through the selected OpenRouter model." },
    ],
    ctaTitle: "Ready to see what your photo can become?",
    ctaDescription: "Start with one image and one clear idea. You can refine the result one version at a time.",
    ctaButton: "Create your first edit",
    footer: "AI image editing with project history and private originals.",
  },
  ru: {
    badge: "AI без сложных инструментов",
    heroStart: "Превратите одну идею в",
    heroAccent: " выразительную фотографию",
    heroDescription: "Загрузите изображение, опишите идею обычными словами, а PhotoAI создаст новую версию и сохранит историю изменений.",
    start: "Начать редактирование",
    openEditor: "Открыть редактор",
    howEyebrow: "Как это работает",
    howTitle: "От загрузки до готового результата за 3 понятных шага",
    howDescription: "Вы принимаете творческие решения, а PhotoAI берёт на себя запрос к модели, версии и историю проекта.",
    steps: [
      { number: "01", icon: Upload, title: "Загрузите изображение", description: "Выберите JPEG, PNG или WebP — оригинал останется доступен на всём протяжении редактирования." },
      { number: "02", icon: WandSparkles, title: "Опишите изменение", description: "Напишите обычными словами, что нужно поменять: от более тёплого неба до совершенно нового настроения." },
      { number: "03", icon: Zap, title: "Сравните и продолжайте", description: "Оцените результат, вернитесь к любой версии или продолжите обработку с выбранного варианта." },
    ],
    featuresEyebrow: "Создано для экспериментов",
    featuresTitle: "Всё необходимое остаётся организованным",
    featuresDescription: "Единое пространство для создания, сравнения и продолжения работы с важными изображениями.",
    features: [
      { icon: Layers3, title: "Последовательное редактирование", description: "Применяйте несколько изменений подряд, сохраняя визуальный контекст предыдущего результата.", className: "md:col-span-2" },
      { icon: History, title: "Полная история версий", description: "Вернитесь к любому прошлому варианту и используйте его как основу для следующей идеи." },
      { icon: ImageIcon, title: "Личная галерея", description: "Храните проекты в одном месте и открывайте их снова, когда захотите продолжить." },
      { icon: Sparkles, title: "Готовые идеи для промптов", description: "Начинайте быстрее с практичных подсказок для обработки изображений.", className: "md:col-span-2" },
    ],
    trustPoints: [
      { icon: ShieldCheck, title: "Приватные файлы проектов", description: "Оригиналы доступны только после входа в ваш аккаунт." },
      { icon: Clock3, title: "Быстрый процесс", description: "Переходите от идеи к новой версии без сложной панели инструментов." },
      { icon: Sparkles, title: "Nano Banana", description: "Обработка изображений выполняется выбранной моделью через OpenRouter." },
    ],
    ctaTitle: "Готовы увидеть новую версию своей фотографии?",
    ctaDescription: "Начните с одного изображения и понятной идеи. Дальше можно улучшать результат версия за версией.",
    ctaButton: "Создать первую версию",
    footer: "AI-редактирование с историей проектов и приватными оригиналами.",
  },
};

export default function HomePage() {
  const { locale } = useLocale();
  const text = copy[locale];
  return (
    <div className="overflow-hidden">
      <section className="relative pb-16 pt-16 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-28">
        <div className="absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[radial-gradient(circle_at_50%_12%,hsl(var(--primary)/0.12),transparent_46%)]" />

        <div className="site-container text-center">
          <Badge variant="outline" className="mb-6 gap-2 border-primary/20 bg-background/75 px-3 py-1.5 shadow-xs backdrop-blur">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              AI
            </span>
            {text.badge}
          </Badge>

          <h1 className="mx-auto max-w-5xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            {text.heroStart}
            <span className="text-primary">{text.heroAccent}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {text.heroDescription}
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="group min-w-48" data-testid="button-get-started">
              <Link href="/onboarding">
                {text.start}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-w-48" data-testid="button-try-editor">
              <Link href="/editor">
                <Sparkles />
                {text.openEditor}
              </Link>
            </Button>
          </div>

          <div className="mt-14 sm:mt-16 lg:mt-20">
            <LandingEditorPreview />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-spacing scroll-mt-24 border-y bg-muted/25">
        <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{text.howEyebrow}</p>
            <h2 className="mt-3 max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {text.howTitle}
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-muted-foreground">
              {text.howDescription}
            </p>
          </div>

          <ol className="divide-y border-y">
            {text.steps.map(({ number, icon: Icon, title, description }) => (
              <li key={number} className="grid gap-4 py-7 sm:grid-cols-[4rem_1fr] sm:gap-6 sm:py-9">
                <div className="flex items-center gap-3 sm:block">
                  <span className="text-sm font-semibold text-primary">{number}</span>
                  <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary sm:ml-0 sm:mt-4">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="section-spacing scroll-mt-24">
        <div className="site-container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{text.featuresEyebrow}</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{text.featuresTitle}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              {text.featuresDescription}
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {text.features.map(({ icon: Icon, title, description, className }) => (
              <Card
                key={title}
                className={cn(
                  "group relative min-h-56 overflow-hidden p-6 transition-colors hover:border-primary/30",
                  className,
                )}
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/0 blur-3xl transition-colors group-hover:bg-primary/10" />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-8 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="relative mt-3 max-w-lg leading-7 text-muted-foreground">{description}</p>
              </Card>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {text.trustPoints.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-3 rounded-lg border bg-muted/20 p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section-spacing scroll-mt-24 border-y bg-muted/25">
        <div className="site-container max-w-4xl">
          <PremiumPlanCard />
        </div>
      </section>

      <section className="px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="site-container relative overflow-hidden rounded-2xl bg-zinc-950 px-6 py-14 text-white shadow-xl dark:border dark:border-border dark:bg-card dark:text-card-foreground sm:px-10 sm:py-16 lg:px-16">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <WandSparkles className="h-5 w-5" />
            </span>
            <h2 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{text.ctaTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-white/65 dark:text-muted-foreground">
              {text.ctaDescription}
            </p>
            <Button asChild size="lg" className="group mt-8 min-w-52" data-testid="button-cta-bottom">
              <Link href="/onboarding">
                {text.ctaButton}
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="site-container flex flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            PhotoAI
          </div>
          <p>{text.footer}</p>
        </div>
      </footer>
    </div>
  );
}
