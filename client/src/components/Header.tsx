import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  CreditCard,
  Image as ImageIcon,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { locale, toggleLocale } = useLocale();
  const isRussian = locale === "ru";

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((current) => !current);
  };

  const logout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = () => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 py-3 sm:px-4">
      <div className="site-container px-0 sm:px-0 lg:px-0">
        <div className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/90 px-3 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/75 sm:px-4">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/"
              aria-label={isRussian ? "PhotoAI — на главную" : "PhotoAI — home"}
              className="group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              data-testid="link-home"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs transition-transform group-hover:-rotate-3">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="hidden text-base font-semibold tracking-tight min-[360px]:inline sm:text-lg">
                PhotoAI
              </span>
            </Link>

            <nav aria-label={isRussian ? "Основная навигация" : "Main navigation"} className="hidden items-center gap-1 md:flex">
              <Button asChild variant="ghost" size="sm">
                <a href="/#pricing" data-testid="button-pricing">
                  <CreditCard />
                  {isRussian ? "Тарифы" : "Pricing"}
                </a>
              </Button>
              {isAuthenticated && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/editor" data-testid="button-editor">
                      <Sparkles />
                      {isRussian ? "Редактор" : "Editor"}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/gallery" data-testid="button-gallery">
                      <ImageIcon />
                      {isRussian ? "Галерея" : "Gallery"}
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              aria-label={isRussian ? "Переключить на английский" : "Switch to Russian"}
              title={isRussian ? "Переключить на английский" : "Switch to Russian"}
              variant="ghost"
              size="sm"
              onClick={toggleLocale}
              data-testid="button-language-toggle"
              className="h-9 min-w-10 px-2 font-mono text-xs font-semibold"
            >
              {locale.toUpperCase()}
            </Button>
            <Button
              aria-label={isDark
                ? (isRussian ? "Включить светлую тему" : "Use light mode")
                : (isRussian ? "Включить тёмную тему" : "Use dark mode")}
              aria-pressed={isDark}
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="h-9 w-9"
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>

            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <div className="hidden items-center gap-2 md:flex">
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                      <Link href="/account" aria-label={isRussian ? "Открыть аккаунт" : "Open account"}>
                        <Avatar className="h-8 w-8" data-testid="avatar-user">
                          <AvatarImage src={user?.profileImageUrl || ""} />
                          <AvatarFallback>{getInitials()}</AvatarFallback>
                        </Avatar>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      data-testid="button-logout"
                    >
                      <LogOut />
                      {isRussian ? "Выйти" : "Logout"}
                    </Button>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        aria-label={isRussian ? "Открыть меню" : "Open menu"}
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 md:hidden"
                        data-testid="button-mobile-menu"
                      >
                        <Menu />
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[min(88vw,22rem)] border-border bg-background/95 backdrop-blur-xl">
                      <SheetHeader className="text-left">
                        <SheetTitle className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          PhotoAI
                        </SheetTitle>
                        <SheetDescription>
                          {isRussian ? "Навигация по вашему рабочему пространству" : "Navigate your workspace"}
                        </SheetDescription>
                      </SheetHeader>

                      <nav aria-label={isRussian ? "Мобильная навигация" : "Mobile navigation"} className="mt-8 grid gap-2">
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/editor" data-testid="link-mobile-editor">
                              <Sparkles />
                              {isRussian ? "Редактор" : "Editor"}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/gallery" data-testid="link-mobile-gallery">
                              <ImageIcon />
                              {isRussian ? "Галерея" : "Gallery"}
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/account" data-testid="link-mobile-account">
                              <UserRound />
                              {isRussian ? "Аккаунт" : "Account"}
                            </Link>
                          </Button>
                        </SheetClose>
                        <div className="my-2 h-px bg-border" />
                        <Button
                          variant="ghost"
                          className="justify-start text-muted-foreground hover:text-foreground"
                          onClick={logout}
                        >
                          <LogOut />
                          {isRussian ? "Выйти" : "Logout"}
                        </Button>
                      </nav>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Button asChild size="sm" className="h-9 px-3 sm:px-4">
                  <Link href="/login" data-testid="button-login">
                    <LogIn className="hidden sm:block" />
                    {isRussian ? "Войти" : "Log in"}
                  </Link>
                </Button>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
