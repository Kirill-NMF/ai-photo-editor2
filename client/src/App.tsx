import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import { ShieldCheck } from "lucide-react";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const pageTitle = location.startsWith("/gallery")
    ? "Gallery"
    : location.startsWith("/account")
      ? "Account"
      : "Image Editor";

  return (
    <ProtectedRoute>
      <div className="flex h-svh w-full bg-sidebar">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-background px-4 py-2 text-sm font-semibold shadow-lg focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Перейти к основному содержимому
        </a>
        <AppSidebar />
        <SidebarInset className="min-w-0 overflow-hidden border-border/70 md:border">
          <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/85 px-3 backdrop-blur-xl sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger
                data-testid="button-sidebar-toggle"
                className="h-9 w-9 rounded-md border bg-background shadow-2xs"
              />
              <div className="h-5 w-px bg-border" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{pageTitle}</p>
                <p className="hidden text-xs text-muted-foreground sm:block">PhotoAI workspace</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Private workspace
            </div>
          </header>
          <main id="main-content" className="min-h-0 flex-1 overflow-y-auto" tabIndex={-1}>
            {children}
          </main>
        </SidebarInset>
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
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-background px-4 py-2 text-sm font-semibold shadow-lg focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Перейти к основному содержимому
      </a>
      {showHeader && <Header />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
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
