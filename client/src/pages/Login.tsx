import TelegramLogin from "@/components/TelegramLogin";
import { Lock, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  const featureList = [
    {
      icon: <Sparkles className="h-5 w-5 text-primary" />,
      title: "Creative freedom",
      description: "Craft limitless edits powered by our AI toolset.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: "Secured access",
      description: "Encrypted sessions with Telegram verification.",
    },
    {
      icon: <Lock className="h-5 w-5 text-primary" />,
      title: "Private workspace",
      description: "Projects stay protected until you choose to share.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/15 via-background to-background">
      <div className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white shadow-2xl backdrop-blur">
          <h2 className="text-3xl font-semibold" style={{ color: "#2c3e5d" }}>
            Continue to PhotoAI
          </h2>
          <p className="mt-3 text-lg" style={{ color: "#2c3e5d" }}>
            Authenticate with Telegram to start editing instantly.
          </p>

          <div className="mt-10 flex justify-center">
            <TelegramLogin />
          </div>

          <p className="mt-8 text-sm" style={{ color: "#939393" }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
            Telegram only shares your public profile information.
          </p>
        </div>
      </div>
    </div>
  );
}
