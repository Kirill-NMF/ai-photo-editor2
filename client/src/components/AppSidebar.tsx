import { Link, useLocation } from "wouter";
import { FolderOpen, Image as ImageIcon, LogOut, Sparkles, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";

const menuItems = [
  {
    title: { en: "Image Editor", ru: "Редактор" },
    url: "/editor",
    icon: ImageIcon,
  },
  {
    title: { en: "Gallery", ru: "Галерея" },
    url: "/gallery",
    icon: FolderOpen,
  },
  {
    title: { en: "Account", ru: "Аккаунт" },
    url: "/account",
    icon: User,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { locale } = useLocale();

  const getInitials = () => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return user.firstName + " " + user.lastName;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split("@")[0];
    return "User";
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-3">
        <Link
          href="/"
          className="flex h-11 items-center gap-3 rounded-lg px-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label={locale === "ru" ? "PhotoAI — на главную" : "PhotoAI home"}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-xs">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold tracking-tight">PhotoAI</span>
            <span className="block truncate text-[11px] text-sidebar-foreground/55">
              {locale === "ru" ? "Творческое пространство" : "Creative workspace"}
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="px-3">
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.14em]">
            {locale === "ru" ? "Пространство" : "Workspace"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || location.startsWith(item.url + "/")}
                    tooltip={item.title[locale]}
                    className="h-10 gap-3 px-3 data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary hover:bg-sidebar-accent"
                  >
                    <Link
                      href={item.url}
                      data-testid={"nav-" + item.title.en.toLowerCase().replace(" ", "-")}
                    >
                      <item.icon />
                      <span>{item.title[locale]}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-lg border border-sidebar-border bg-background/55 p-2 group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
          <Link
            href="/account"
            className="flex min-w-0 items-center gap-3 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <span className="block truncate text-sm font-medium" data-testid="text-user-name">
                {getDisplayName()}
              </span>
              <span className="block truncate text-xs text-muted-foreground">{user?.email || ""}</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:mt-1 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-2"
            onClick={() => {
              window.location.href = "/api/logout";
            }}
            data-testid="button-sidebar-logout"
          >
            <LogOut />
            <span className="group-data-[collapsible=icon]:hidden">
              {locale === "ru" ? "Выйти" : "Logout"}
            </span>
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
