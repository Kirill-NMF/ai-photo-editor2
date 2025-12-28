// Integration: Replit Auth (blueprint:javascript_log_in_with_replit)
import { useAuthContext } from "@/contexts/AuthContext";

export const useAuth = () => {
  return useAuthContext();
};
