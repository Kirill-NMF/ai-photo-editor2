import { useEffect, useRef } from "react";

export default function TelegramLogin() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute(
      "data-telegram-login",
      import.meta.env.VITE_TELEGRAM_BOT_NAME || "",
    );
    script.setAttribute("data-size", "large");
    script.setAttribute(
      "data-auth-url",
      "http://77.110.104.123:5000/api/auth/telegram/callback",
    );
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
