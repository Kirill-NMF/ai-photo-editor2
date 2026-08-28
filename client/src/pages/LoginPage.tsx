import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Check, RefreshCw, Sparkles, WandSparkles } from "lucide-react";
import { SiGoogle, SiTelegram } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { hasTelegramWidgetFrame } from "@/lib/telegramWidget";
import { useLocale } from "@/contexts/LocaleContext";

const ERROR_MESSAGES: Record<"en" | "ru", Record<string, string>> = {
  en: {
    missing_fields: "Telegram sign-in failed: authentication data is missing.",
    invalid_signature: "Telegram sign-in failed: invalid signature. Please try again.",
    expired: "Telegram sign-in data has expired. Please try again.",
    session_failed: "Could not create your session. Please try again.",
    server_error: "Telegram sign-in is temporarily unavailable. Please try again later.",
    google_not_configured: "Google sign-in is not configured yet.",
    google_failed: "Could not sign in with Google. Please try again.",
  },
  ru: {
    missing_fields: "Ошибка входа через Telegram: отсутствуют данные авторизации.",
    invalid_signature: "Ошибка входа через Telegram: неверная подпись. Попробуйте ещё раз.",
    expired: "Ошибка входа через Telegram: данные авторизации устарели. Попробуйте ещё раз.",
    session_failed: "Ошибка создания сессии. Попробуйте ещё раз.",
    server_error: "Ошибка сервера при входе через Telegram. Попробуйте позже.",
    google_not_configured: "Вход через Google пока не настроен.",
    google_failed: "Не удалось войти через Google. Попробуйте ещё раз.",
  },
};

const copy = {
  en: {
    fallbackError: "Sign-in failed. Please try again.",
    loading: "Loading...",
    eyebrow: "Your creative workspace",
    title: "Return to your projects and continue from any version",
    description: "One account keeps your gallery, edit history, and access to PhotoAI tools together.",
    benefits: ["Keep the history of every version", "Continue editing from any result", "Keep originals in private storage"],
    mobileTitle: "Log in to PhotoAI",
    welcome: "Welcome back",
    chooseMethod: "Choose how you want to sign in to open the editor and gallery.",
    google: "Continue with Google",
    or: "or",
    telegramLoading: "Connecting Telegram…",
    telegramError: "Telegram sign-in could not load. Try again or use Google.",
    retry: "Try again",
    telegramDisabled: "Telegram (not configured)",
    telegramLoadingLabel: "Loading Telegram sign-in",
    terms: "By continuing, you agree to the service terms of use.",
  },
  ru: {
    fallbackError: "Ошибка входа. Попробуйте ещё раз.",
    loading: "Загрузка...",
    eyebrow: "Ваше творческое пространство",
    title: "Вернитесь к своим проектам и продолжайте с любой версии",
    description: "Один аккаунт хранит галерею, историю редактирования и доступ к AI‑инструментам PhotoAI.",
    benefits: ["Сохраняйте историю каждой версии", "Продолжайте редактирование с любого результата", "Держите оригиналы в приватном хранилище"],
    mobileTitle: "Вход в PhotoAI",
    welcome: "Добро пожаловать",
    chooseMethod: "Выберите удобный способ входа, чтобы открыть редактор и галерею.",
    google: "Войти через Google",
    or: "или",
    telegramLoading: "Подключаем Telegram…",
    telegramError: "Не удалось загрузить вход через Telegram. Можно повторить или войти через Google.",
    retry: "Повторить",
    telegramDisabled: "Telegram (не настроен)",
    telegramLoadingLabel: "Загрузка входа через Telegram",
    terms: "Продолжая, вы соглашаетесь с условиями использования сервиса.",
  },
};

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { locale } = useLocale();
  const text = copy[locale];
  const [telegramConfig, setTelegramConfig] = useState<{ botUsername: string } | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);
  const [telegramWidgetStatus, setTelegramWidgetStatus] = useState<"loading" | "ready" | "error">("loading");
  const [telegramWidgetAttempt, setTelegramWidgetAttempt] = useState(0);

  const errorCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("error")
    : null;
  const errorMessage = errorCode ? (ERROR_MESSAGES[locale][errorCode] ?? text.fallbackError) : null;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/editor");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    fetch("/api/auth/telegram/config")
      .then((res) => {
        if (!res.ok) throw new Error("Not configured");
        return res.json();
      })
      .then((data) => {
        setTelegramConfig(data);
        setTelegramLoading(false);
      })
      .catch(() => {
        setTelegramLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!telegramConfig?.botUsername) return;

    const container = document.getElementById("telegram-widget-container");
    if (!container) return;

    container.innerHTML = "";
    setTelegramWidgetStatus("loading");
    let isDisposed = false;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramConfig.botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", window.location.origin + "/api/auth/telegram/callback");
    script.setAttribute("data-request-access", "write");

    let verificationTimer: number | undefined;
    const verifyWidget = () => {
      if (isDisposed) return;
      setTelegramWidgetStatus(hasTelegramWidgetFrame(container) ? "ready" : "error");
    };

    script.addEventListener("load", () => {
      if (verificationTimer) window.clearTimeout(verificationTimer);
      verificationTimer = window.setTimeout(verifyWidget, 300);
    });
    script.addEventListener("error", () => {
      if (verificationTimer) window.clearTimeout(verificationTimer);
      if (isDisposed) return;
      setTelegramWidgetStatus("error");
    });

    container.appendChild(script);
    verificationTimer = window.setTimeout(verifyWidget, 5000);

    return () => {
      isDisposed = true;
      if (verificationTimer) window.clearTimeout(verificationTimer);
      container.innerHTML = "";
    };
  }, [telegramConfig, telegramWidgetAttempt]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 animate-pulse text-primary" />
          {text.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-5rem)] overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--primary)/0.12),transparent_40%)]" />

      <div className="site-container grid min-h-[calc(100vh-5rem)] items-center gap-12 py-12 lg:grid-cols-[1fr_28rem] lg:py-16">
        <section className="hidden max-w-2xl lg:block" aria-labelledby="login-intro-title">
          <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <WandSparkles className="h-6 w-6" />
          </span>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-primary">{text.eyebrow}</p>
          <h1 id="login-intro-title" className="mt-3 text-5xl font-bold leading-tight tracking-[-0.04em]">
            {text.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            {text.description}
          </p>
          <ul className="mt-8 grid gap-3 text-sm">
            {text.benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight">{text.mobileTitle}</h1>
          </div>

          {errorMessage && (
            <div
              className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
              data-testid="alert-login-error"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Card className="border-border/80 bg-card/95 shadow-xl backdrop-blur">
            <CardHeader>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle>{text.welcome}</CardTitle>
              <CardDescription className="pt-1">
                {text.chooseMethod}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  window.location.href = "/api/auth/google";
                }}
                data-testid="button-login-google"
              >
                <SiGoogle className="h-5 w-5" />
                {text.google}
              </Button>

              {!telegramLoading && telegramConfig && (
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wider">
                    <span className="bg-card px-3 text-muted-foreground">{text.or}</span>
                  </div>
                </div>
              )}

              {!telegramLoading && telegramConfig && telegramWidgetStatus !== "error" && (
                <div className="relative min-h-11">
                  <div
                    id="telegram-widget-container"
                    className="flex min-h-11 items-center justify-center overflow-hidden rounded-md border bg-background px-3 py-2"
                    data-testid="telegram-login-widget"
                  />
                  {telegramWidgetStatus === "loading" && (
                    <div
                      className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-md border bg-background text-sm text-muted-foreground"
                      role="status"
                      aria-live="polite"
                    >
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
                      {text.telegramLoading}
                    </div>
                  )}
                </div>
              )}

              {!telegramLoading && telegramConfig && telegramWidgetStatus === "error" && (
                <div className="rounded-md border border-dashed bg-muted/30 p-3 text-center" role="status">
                  <p className="text-sm text-muted-foreground">
                    {text.telegramError}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setTelegramWidgetStatus("loading");
                      setTelegramWidgetAttempt((attempt) => attempt + 1);
                    }}
                    data-testid="button-retry-telegram"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {text.retry}
                  </Button>
                </div>
              )}

              {!telegramLoading && !telegramConfig && (
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled
                  data-testid="button-login-telegram-disabled"
                >
                  <SiTelegram className="h-5 w-5" />
                  {text.telegramDisabled}
                </Button>
              )}

              {telegramLoading && (
                <div className="h-11 animate-pulse rounded-md bg-muted" aria-label={text.telegramLoadingLabel} />
              )}
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
            {text.terms}
          </p>
        </div>
      </div>
    </div>
  );
}
