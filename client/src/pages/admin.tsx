import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppTheme, Announcement } from "@shared/schema";
import { Trash2, Plus, Send } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeCss, setNewThemeCss] = useState("");
  const [newThemeDesc, setNewThemeDesc] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  const { data: themes = [] } = useQuery<AppTheme[]>({
    queryKey: ["/api/admin/themes"],
  });

  const { data: activeTheme } = useQuery<AppTheme | null>({
    queryKey: ["/api/admin/themes/active"],
  });

  const { data: activeAnnouncement } = useQuery<Announcement | null>({
    queryKey: ["/api/announcements/active"],
  });

  const createThemeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/themes", {
        username,
        name: newThemeName,
        cssOverrides: newThemeCss,
        description: newThemeDesc,
      });
    },
    onSuccess: () => {
      toast({ title: "Theme created!", description: "New theme has been added." });
      setNewThemeName("");
      setNewThemeCss("");
      setNewThemeDesc("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create theme", variant: "destructive" });
    },
  });

  const activateThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      return await apiRequest("POST", `/api/admin/themes/${themeId}/activate`, { username });
    },
    onSuccess: () => {
      toast({ title: "Theme activated!", description: "Site will reload with new theme." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes/active"] });
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate theme", variant: "destructive" });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      return await apiRequest("DELETE", `/api/admin/themes/${themeId}`, { username });
    },
    onSuccess: () => {
      toast({ title: "Theme deleted!", description: "Theme has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete theme", variant: "destructive" });
    },
  });

  const setAdminMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/set-admin", {
        adminUsername: username,
        targetUsername: targetUser,
        isAdmin: true,
      });
    },
    onSuccess: () => {
      toast({ title: "Admin granted!", description: `${targetUser} is now an admin.` });
      setTargetUser("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to grant admin access", variant: "destructive" });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/announcements", {
        username,
        message: announcementMessage,
      });
    },
    onSuccess: () => {
      toast({ title: "Announcement sent!", description: "Message is now showing to all users." });
      setAnnouncementMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/active"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send announcement", variant: "destructive" });
    },
  });

  const christmasThemeCss = `
    --primary: 0 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 200 100% 50%;
    --secondary-foreground: 0 0% 100%;
    --accent: 45 100% 50%;
    --accent-foreground: 0 0% 0%;
    --background: 200 20% 15%;
    --foreground: 0 0% 95%;
    --card: 200 15% 25%;
    --border: 0 100% 50%;
  `;

  const applyChristmasThemeMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/themes", {
        username,
        name: "Christmas Frozen",
        cssOverrides: christmasThemeCss,
        description: "Festive Christmas theme with icy frozen effects and twinkling lights",
      });
    },
    onSuccess: (theme) => {
      toast({ title: "Christmas theme created!", description: "Activating festive theme..." });
      setTimeout(() => {
        activateThemeMutation.mutate(theme.id);
      }, 500);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create Christmas theme", variant: "destructive" });
    },
  });

  const disableAllThemesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/themes/disable-all", { username });
    },
    onSuccess: () => {
      toast({ title: "Themes disabled!", description: "Site returned to default colors." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes/active"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disable themes", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-admin-panel">
          Admin Panel
        </h1>

        {/* Site-wide Announcement */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Site-wide Announcement</CardTitle>
            <CardDescription>Send a message that appears on everyone's screen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeAnnouncement && (
              <div className="p-3 bg-background rounded border border-primary/30 mb-4">
                <p className="text-sm"><span className="font-semibold">Current:</span> {activeAnnouncement.message}</p>
              </div>
            )}
            <Textarea
              placeholder="Enter announcement message (e.g., Server maintenance in 5 minutes)"
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              data-testid="textarea-announcement"
            />
            <Button
              onClick={() => createAnnouncementMutation.mutate()}
              disabled={!announcementMessage || createAnnouncementMutation.isPending}
              data-testid="button-send-announcement"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Announcement
            </Button>
          </CardContent>
        </Card>

        {/* Quick Themes */}
        <Card className="mb-8 bg-gradient-to-r from-red-500/10 to-blue-500/10 border-red-500/50">
          <CardHeader>
            <CardTitle>Quick Holiday Themes</CardTitle>
            <CardDescription>Apply pre-made festive themes instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => applyChristmasThemeMutation.mutate()}
              disabled={applyChristmasThemeMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-apply-christmas-theme"
            >
              {applyChristmasThemeMutation.isPending ? "Creating Christmas Theme..." : "✨ Apply Christmas Frozen Theme"}
            </Button>
            <Button
              onClick={() => disableAllThemesMutation.mutate()}
              disabled={disableAllThemesMutation.isPending}
              variant="outline"
              className="w-full"
              data-testid="button-disable-all-themes"
            >
              {disableAllThemesMutation.isPending ? "Disabling..." : "✖️ Disable All Themes"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Activate a festive Christmas theme with icy blues and warm holiday colors. Or disable all themes to return to defaults.
            </p>
          </CardContent>
        </Card>

        {/* Grant Admin Access */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Grant Admin Access</CardTitle>
            <CardDescription>Give a user admin permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Username to make admin"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                data-testid="input-target-user"
              />
              <Button
                onClick={() => setAdminMutation.mutate()}
                disabled={!targetUser || setAdminMutation.isPending}
                data-testid="button-grant-admin"
              >
                Grant Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Theme */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Theme</CardTitle>
            <CardDescription>Add a new site-wide theme for everyone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Theme name (e.g., Neon Purple)"
              value={newThemeName}
              onChange={(e) => setNewThemeName(e.target.value)}
              data-testid="input-theme-name"
            />
            <Textarea
              placeholder="CSS overrides (e.g., --primary: 280 100% 50%;)"
              value={newThemeCss}
              onChange={(e) => setNewThemeCss(e.target.value)}
              className="font-mono text-sm"
              data-testid="textarea-theme-css"
            />
            <Input
              placeholder="Description (optional)"
              value={newThemeDesc}
              onChange={(e) => setNewThemeDesc(e.target.value)}
              data-testid="input-theme-desc"
            />
            <Button
              onClick={() => createThemeMutation.mutate()}
              disabled={!newThemeName || !newThemeCss || createThemeMutation.isPending}
              data-testid="button-create-theme"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Theme
            </Button>
          </CardContent>
        </Card>

        {/* Active Theme & List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Themes</CardTitle>
            <CardDescription>
              {activeTheme ? `Current active: ${activeTheme.name}` : "No active theme"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {themes.length === 0 ? (
                <p className="text-muted-foreground">No themes created yet</p>
              ) : (
                themes.map((theme) => (
                  <div
                    key={theme.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`theme-item-${theme.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{theme.name}</h3>
                      {theme.description && (
                        <p className="text-sm text-muted-foreground">{theme.description}</p>
                      )}
                      {theme.isActive === "true" && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded mt-1 inline-block">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {theme.isActive !== "true" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateThemeMutation.mutate(theme.id)}
                          disabled={activateThemeMutation.isPending}
                          data-testid={`button-activate-theme-${theme.id}`}
                        >
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteThemeMutation.mutate(theme.id)}
                        disabled={deleteThemeMutation.isPending}
                        data-testid={`button-delete-theme-${theme.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
