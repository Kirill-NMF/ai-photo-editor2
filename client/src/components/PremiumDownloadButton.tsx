import type { ComponentProps } from "react";
import { Download, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/contexts/LocaleContext";
import { usePremiumPaywall } from "@/contexts/PremiumPaywallContext";
import { cn } from "@/lib/utils";

interface PremiumDownloadButtonProps extends Omit<ComponentProps<typeof Button>, "onClick" | "children"> {
  label?: string;
  wrapperClassName?: string;
}

export function PremiumDownloadButton({ label, className, wrapperClassName, ...buttonProps }: PremiumDownloadButtonProps) {
  const { locale } = useLocale();
  const { openPaywall } = usePremiumPaywall();

  return (
    <span className={cn("relative inline-flex", wrapperClassName)}>
      <Button
        type="button"
        variant="outline"
        className={cn("gap-2", className)}
        onClick={() => openPaywall("download")}
        {...buttonProps}
      >
        <Download aria-hidden="true" />
        {label ?? (locale === "ru" ? "Скачать" : "Download")}
      </Button>
      <span
        className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/35 bg-amber-300 text-amber-950 shadow-sm dark:bg-amber-400"
        aria-hidden="true"
      >
        <LockKeyhole className="h-3 w-3" />
      </span>
    </span>
  );
}
