// Integration: Replit Auth (blueprint:javascript_log_in_with_replit)
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  useEffect(() => {
    if (!isLoading && (!token || !isAuthenticated)) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access this page. Redirecting...",
        variant: "destructive",
      });
      const timer = setTimeout(() => {
        navigate("/");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate, toast, token]);

  if (token && isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
