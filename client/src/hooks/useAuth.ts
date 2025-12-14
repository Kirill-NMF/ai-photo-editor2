// Integration: Replit Auth (blueprint:javascript_log_in_with_replit)
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user", token],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("authToken");
        return null;
      }

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      return await res.json();
    },
  });

  const isAuthenticated = useMemo(
    () => Boolean(token && user),
    [token, user],
  );

  return {
    user: user ?? undefined,
    isLoading: token ? isLoading : false,
    isAuthenticated,
  };
}
