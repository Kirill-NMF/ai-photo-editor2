import TelegramLoginButton from "react-telegram-login";

export default function TelegramLogin() {
  const redirectUrl = "http://77.110.104.123:5000/api/auth/telegram/callback";
  return (
    <TelegramLoginButton
      botName={import.meta.env.VITE_TELEGRAM_BOT_NAME}
      dataAuthUrl={redirectUrl}
      requestAccess="write"
      usePic={true}
      buttonSize="large"
    />
  );
}
