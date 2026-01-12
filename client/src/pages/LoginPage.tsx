import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { SiGoogle, SiTelegram } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [telegramConfig, setTelegramConfig] = useState<{ botUsername: string } | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(true);

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

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", telegramConfig.botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", window.location.origin + "/api/auth/telegram/callback");
    script.setAttribute("data-request-access", "write");

    container.appendChild(script);
  }, [telegramConfig]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-semibold">PhotoAI</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Добро пожаловать</CardTitle>
            <CardDescription>
              Выберите способ входа для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login-google"
            >
              <SiGoogle className="h-5 w-5 mr-3" />
              Войти через Google
            </Button>

            {!telegramLoading && telegramConfig && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">или</span>
                </div>
              </div>
            )}

            {!telegramLoading && telegramConfig && (
              <div 
                id="telegram-widget-container" 
                className="flex justify-center"
                data-testid="telegram-login-widget"
              />
            )}

            {!telegramLoading && !telegramConfig && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                disabled
                data-testid="button-login-telegram-disabled"
              >
                <SiTelegram className="h-5 w-5 mr-3" />
                Telegram (не настроен)
              </Button>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Продолжая, вы соглашаетесь с условиями использования
        </p>
      </div>
    </div>
  );
}
