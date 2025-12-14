import { useState } from "react";
import TelegramLoginButton, { TelegramUser } from "react-telegram-login";
import { useLocation } from "wouter";

export default function TelegramLogin() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTelegramResponse = async (user: TelegramUser) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/telegram/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error("Telegram authentication failed");
      }

      const { token } = await response.json();
      localStorage.setItem("authToken", token);
      navigate("/editor");
    } catch (error) {
      console.error("Telegram login error:", error);
      alert("Failed to sign in with Telegram. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TelegramLoginButton
      botName={import.meta.env.VITE_TELEGRAM_BOT_NAME}
      dataOnauth={handleTelegramResponse}
      requestAccess="write"
      usePic={true}
      disabled={isSubmitting}
      buttonSize="large"
    />
  );
}
