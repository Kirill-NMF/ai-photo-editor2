import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/LoginPage";
import EditorPage from "@/pages/EditorPage";
import GalleryPage from "@/pages/GalleryPage";
import AccountPage from "@/pages/AccountPage";
import NotFound from "@/pages/not-found";
import { RateLimitProvider } from "@/contexts/RateLimitContext";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center gap-2 p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function RouterContent() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/editor/:imageId">
        <DashboardLayout><EditorPage /></DashboardLayout>
      </Route>
      <Route path="/editor">
        <DashboardLayout><EditorPage /></DashboardLayout>
      </Route>
      <Route path="/gallery">
        <DashboardLayout><GalleryPage /></DashboardLayout>
      </Route>
      <Route path="/account">
        <DashboardLayout><AccountPage /></DashboardLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  
  // Routes that should not show the header
  const noHeaderRoutes = ["/editor", "/gallery", "/account"];
  const showHeader = !noHeaderRoutes.some(route => location.startsWith(route));

  // Routes that use the sidebar
  const dashboardRoutes = ["/editor", "/gallery", "/account"];
  const useSidebar = dashboardRoutes.some(route => location.startsWith(route));

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (useSidebar) {
    return (
      <SidebarProvider style={style as React.CSSProperties}>
        <RouterContent />
        <Toaster />
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      <main className="flex-1">
        <RouterContent />
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RateLimitProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </RateLimitProvider>
    </QueryClientProvider>
  );
}

export default App;
