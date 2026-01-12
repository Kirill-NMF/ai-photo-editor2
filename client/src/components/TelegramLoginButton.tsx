import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SiTelegram } from "react-icons/si";

interface TelegramLoginButtonProps {
  onAuthUrl?: string;
  size?: "small" | "medium" | "large";
  className?: string;
}

export function TelegramLoginButton({ 
  onAuthUrl = "/api/auth/telegram/callback",
  size = "large",
  className = ""
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/telegram/config")
      .then((res) => {
        if (!res.ok) throw new Error("Telegram auth not configured");
        return res.json();
      })
      .then((data) => {
        setBotUsername(data.botUsername);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!botUsername || !containerRef.current) return;

    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size);
    script.setAttribute("data-auth-url", window.location.origin + onAuthUrl);
    script.setAttribute("data-request-access", "write");

    containerRef.current.appendChild(script);
  }, [botUsername, onAuthUrl, size]);

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <SiTelegram className="h-4 w-4 mr-2" />
        Загрузка...
      </Button>
    );
  }

  if (error || !botUsername) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className={`flex justify-center ${className}`}
      data-testid="telegram-login-widget"
    />
  );
}
