import {
  Camera,
  Gauge,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useRateLimit } from "@/contexts/RateLimitContext";
import { useAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const { user } = useAuth();
  const { remaining, resetDate, isAdmin } = useRateLimit();

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
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return user.firstName + " " + user.lastName;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split("@")[0];
    return "";
  };

  return (
    <div className="bg-background">
      <div className="site-container max-w-6xl py-8 sm:py-10 lg:py-12">
        <div className="mb-9 border-b pb-8">
          <Badge variant="outline" className="mb-4 gap-2 bg-muted/30">
            <Settings2 className="h-3.5 w-3.5 text-primary" />
            Workspace settings
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" data-testid="text-account-title">
            Account Settings
          </h1>
          <p className="mt-2 text-muted-foreground">Manage your profile, usage, and editing preferences.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription className="mt-1">Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
                <div>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-primary/10">
                      <AvatarImage src={user?.profileImageUrl || ""} />
                      <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{getDisplayName() || "PhotoAI user"}</p>
                      <p className="truncate text-sm text-muted-foreground">{user?.email || ""}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-5 w-full" data-testid="button-change-avatar">
                    <Camera />
                    Change Avatar
                  </Button>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" defaultValue={user?.firstName || ""} data-testid="input-first-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" defaultValue={user?.lastName || ""} data-testid="input-last-name" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ""} data-testid="input-email" />
                  </div>
                  <div className="flex justify-end sm:col-span-2">
                    <Button data-testid="button-save-profile">Save Changes</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Gauge className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>API Usage</CardTitle>
                  <CardDescription className="mt-1">Monitor your AI editing quota</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <Badge variant="secondary" className="gap-1.5" data-testid="badge-admin-unlimited">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Admin Account
                  </Badge>
                  <p className="mt-4 font-medium" data-testid="text-admin-status">Unlimited AI edits</p>
                  <p className="mt-1 text-sm text-muted-foreground">No monthly restrictions</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Edits Remaining</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight" data-testid="text-ai-edits-remaining">
                        {remaining} <span className="text-sm font-normal text-muted-foreground">/ 11</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Resets on</p>
                      {resetDate ? (
                        <p className="mt-1 text-sm font-semibold" data-testid="text-reset-date">
                          {new Intl.DateTimeFormat("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }).format(resetDate)}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground" data-testid="text-reset-date-unknown">
                          Loading...
                        </p>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={Math.max(0, Math.min(100, (remaining / 11) * 100))}
                    aria-label="AI edits remaining"
                    data-testid="progress-ai-edits"
                  />
                  <p className="text-xs leading-5 text-muted-foreground" data-testid="text-usage-info">
                    Бесплатный тариф включает 11 AI редактирований в месяц. Для увеличения лимита используйте промо-код в Editor.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription className="mt-1">Update your password to keep your account secure</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" data-testid="input-current-password" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="••••••••" data-testid="input-new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="••••••••" data-testid="input-confirm-password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button data-testid="button-change-password">Change Password</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription className="mt-1">Customize your editing experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Auto-save edits</p>
                  <p className="mt-1 text-sm text-muted-foreground">Automatically save edits to your gallery</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-toggle-autosave">Enabled</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Show prompt suggestions</p>
                  <p className="mt-1 text-sm text-muted-foreground">Display suggested prompts in the editor</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-toggle-suggestions">Enabled</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 lg:col-span-2">
            <CardHeader>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription className="mt-1">Irreversible account actions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm" data-testid="button-delete-account">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
