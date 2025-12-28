import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RateLimitContextType {
  remaining: number;
  resetDate: Date | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const RateLimitContext = createContext<RateLimitContextType | null>(null);

export function RateLimitProvider({ children }: { children: ReactNode }) {
  const [remaining, setRemaining] = useState<number>(11);
  const [resetDate, setResetDate] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refresh = async () => {
    try {
      const response = await fetch('/api/rate-limit');
      if (!response.ok) return;
      
      const data = await response.json();
      
      setRemaining(data.remaining);
      setResetDate(data.resetDate ? new Date(data.resetDate) : null);
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('[RateLimit] Failed to fetch:', error);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <RateLimitContext.Provider value={{ remaining, resetDate, isAdmin, refresh }}>
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimit must be used within RateLimitProvider');
  }
  return context;
}
