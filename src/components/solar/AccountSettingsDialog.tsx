import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, User, Key, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { ModernLoader } from "@/components/ui/ModernLoader";
import { changePasswordServerFn, getAuditLogsServerFn } from "@/backend/auth-actions";

export function AccountSettingsDialog() {
  const { client, updateProfile } = useAuth();
  const [open, setOpen] = useState(false);

  // Profile form state
  const [name, setName] = useState(client?.name ?? "");
  const [site, setSite] = useState(client?.site ?? "");
  const [capacity, setCapacity] = useState(String(client?.capacityKw ?? 4));
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Audit logs state
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      action: string;
      success: number;
      details: string | null;
      createdAt: string;
    }>
  >([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  if (!client) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const capNum = parseFloat(capacity);
    const res = await updateProfile({
      name,
      site,
      capacityKw: isNaN(capNum) ? undefined : capNum,
    });
    setSavingProfile(false);
    if (!res.ok) {
      toast.error(res.error ?? "Failed to update profile");
      return;
    }
    toast.success("Array profile updated successfully");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await changePasswordServerFn({
        data: { currentPassword, newPassword },
      });
      setSavingPassword(false);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to change password");
        return;
      }
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setSavingPassword(false);
      toast.error(err instanceof Error ? err.message : "Password update failed");
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await getAuditLogsServerFn();
      setLogs(res.logs ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setName(client.name);
          setSite(client.site);
          setCapacity(String(client.capacityKw));
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Settings className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" /> Account & Security
          </DialogTitle>
          <DialogDescription>
            Manage your solar plant profile, login credentials, and session audit history.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="profile"
          className="mt-2"
          onValueChange={(v) => v === "audit" && loadAuditLogs()}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 pt-4">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-email">Email (read-only)</Label>
                <Input id="prof-email" value={client.email} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-name">Contact / Organization Name</Label>
                <Input
                  id="prof-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-site">Plant / Site Name</Label>
                  <Input
                    id="prof-site"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="prof-cap">Capacity (kWp)</Label>
                  <Input
                    id="prof-cap"
                    type="number"
                    step="0.1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </form>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 pt-4">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="curr-pass">Current Password</Label>
                <Input
                  id="curr-pass"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-pass">New Password (min. 6 characters)</Label>
                <Input
                  id="new-pass"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={savingPassword}>
                {savingPassword ? (
                  <div className="flex items-center gap-2">
                    <ModernLoader size="sm" />
                    <span>Updating…</span>
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Recent authentication events recorded in the server database:
            </p>
            {loadingLogs ? (
              <div className="flex justify-center py-8">
                <ModernLoader size="md" label="Loading Security Audit Log" />
              </div>
            ) : logs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent security events.
              </p>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-lg border border-border bg-card/60 p-2.5 text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {log.action === "login_success" && "Signed in successfully"}
                        {log.action === "login_failure" && "Failed sign-in attempt"}
                        {log.action === "register_success" && "Registered new account"}
                        {log.action === "password_change" && "Password updated"}
                      </p>
                      {log.details && <p className="text-muted-foreground">{log.details}</p>}
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
