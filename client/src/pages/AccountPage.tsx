import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/contexts/RateLimitContext";

export default function AccountPage() {
  const { user } = useAuth();
  const { remaining, resetDate, isAdmin } = useRateLimit();

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

  const getDisplayName = () => {
    if (!user) return "";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split("@")[0];
    return "";
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2" data-testid="text-account-title">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profileImageUrl || ""} />
                <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" data-testid="button-change-avatar">
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  defaultValue={user?.firstName || ""}
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  defaultValue={user?.lastName || ""}
                  data-testid="input-last-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button data-testid="button-save-profile">Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Usage</CardTitle>
            <CardDescription>Monitor your AI editing quota</CardDescription>
          </CardHeader>
          <CardContent>
            {isAdmin ? (
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <Badge variant="secondary" className="text-sm" data-testid="badge-admin-unlimited">
                  Admin Account
                </Badge>
                <div>
                  <p className="font-medium" data-testid="text-admin-status">Unlimited AI edits</p>
                  <p className="text-sm text-muted-foreground">No monthly restrictions</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground">AI Edits Remaining</p>
                    <p className="text-2xl font-bold" data-testid="text-ai-edits-remaining">
                      {remaining} <span className="text-base font-normal text-muted-foreground">/ 11</span>
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Resets on</p>
                    {resetDate ? (
                      <p className="text-sm font-semibold" data-testid="text-reset-date">
                        {new Intl.DateTimeFormat('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }).format(resetDate)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground" data-testid="text-reset-date-unknown">
                        Loading...
                      </p>
                    )}
                  </div>
                </div>
                
                <Progress value={Math.max(0, Math.min(100, (remaining / 11) * 100))} className="h-2" data-testid="progress-ai-edits" />
                
                <p className="text-xs text-muted-foreground" data-testid="text-usage-info">
                  Бесплатный тариф включает 11 AI редактирований в месяц. 
                  Для увеличения лимита используйте промо-код в Editor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                data-testid="input-confirm-password"
              />
            </div>
            <div className="flex justify-end">
              <Button data-testid="button-change-password">Change Password</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your editing experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-save edits</p>
                <p className="text-sm text-muted-foreground">Automatically save edits to your gallery</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-toggle-autosave">
                Enabled
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show prompt suggestions</p>
                <p className="text-sm text-muted-foreground">Display suggested prompts in the editor</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-toggle-suggestions">
                Enabled
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm" data-testid="button-delete-account">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
