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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to log in to access this page. Redirecting...",
        variant: "destructive",
      });
      const timer = setTimeout(() => {
        navigate("/login");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}
