import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
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

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

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
              aria-label="PhotoAI — на главную"
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

            {isAuthenticated && (
              <nav aria-label="Основная навигация" className="hidden items-center gap-1 md:flex">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/editor" data-testid="button-editor">
                    <Sparkles />
                    Editor
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/gallery" data-testid="button-gallery">
                    <ImageIcon />
                    Gallery
                  </Link>
                </Button>
              </nav>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
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
                      <Link href="/account" aria-label="Открыть аккаунт">
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
                      Logout
                    </Button>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        aria-label="Открыть меню"
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
                        <SheetDescription>Навигация по вашему рабочему пространству</SheetDescription>
                      </SheetHeader>

                      <nav aria-label="Мобильная навигация" className="mt-8 grid gap-2">
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/editor" data-testid="link-mobile-editor">
                              <Sparkles />
                              Editor
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/gallery" data-testid="link-mobile-gallery">
                              <ImageIcon />
                              Gallery
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button asChild variant="ghost" className="justify-start">
                            <Link href="/account" data-testid="link-mobile-account">
                              <UserRound />
                              Account
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
                          Logout
                        </Button>
                      </nav>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Button asChild size="sm" className="h-9 px-3 sm:px-4">
                  <Link href="/login" data-testid="button-login">
                    <LogIn className="hidden sm:block" />
                    Войти
                  </Link>
                </Button>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
