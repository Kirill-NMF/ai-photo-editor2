import { createContext, useContext, useMemo, useState } from "react";

import { PremiumPaywall } from "@/components/PremiumPaywall";
import type { PaywallTrigger } from "@/lib/premiumExperience";

interface PremiumPaywallContextValue {
  openPaywall: (trigger: PaywallTrigger) => void;
}

const PremiumPaywallContext = createContext<PremiumPaywallContextValue | null>(null);

export function PremiumPaywallProvider({ children }: { children: React.ReactNode }) {
  const [trigger, setTrigger] = useState<PaywallTrigger | null>(null);
  const value = useMemo(() => ({ openPaywall: setTrigger }), []);

  return (
    <PremiumPaywallContext.Provider value={value}>
      {children}
      <PremiumPaywall isOpen={trigger !== null} trigger={trigger ?? "pricing"} onClose={() => setTrigger(null)} />
    </PremiumPaywallContext.Provider>
  );
}

export function usePremiumPaywall(): PremiumPaywallContextValue {
  const context = useContext(PremiumPaywallContext);
  if (!context) throw new Error("usePremiumPaywall must be used inside PremiumPaywallProvider");
  return context;
}
