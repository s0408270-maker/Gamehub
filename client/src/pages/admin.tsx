import { useState, useEffect } from "react";
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

const THEME_PRESETS = [
  {
    name: "Christmas Frozen",
    description: "Festive Christmas theme with icy frozen effects and twinkling lights",
    cssOverrides: `
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
  `,
  },
  {
    name: "Neon Night",
    description: "Vibrant neon colors for a cyberpunk gaming experience",
    cssOverrides: `
    --primary: 280 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 180 100% 50%;
    --secondary-foreground: 0 0% 0%;
    --accent: 340 100% 50%;
    --accent-foreground: 0 0% 100%;
    --background: 250 30% 10%;
    --foreground: 270 100% 95%;
    --card: 250 30% 20%;
    --border: 280 100% 50%;
  `,
  },
  {
    name: "Ocean Blue",
    description: "Cool blue tones with aquatic vibes",
    cssOverrides: `
    --primary: 200 100% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 160 100% 50%;
    --secondary-foreground: 0 0% 0%;
    --accent: 30 100% 50%;
    --accent-foreground: 0 0% 0%;
    --background: 210 25% 15%;
    --foreground: 200 30% 95%;
    --card: 210 25% 25%;
    --border: 200 100% 50%;
  `,
  },
];

export default function AdminPanel() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [targetUser, setTargetUser] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [customThemeName, setCustomThemeName] = useState("");
  const [customThemeCss, setCustomThemeCss] = useState("");
  const [customThemeDesc, setCustomThemeDesc] = useState("");

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
  }, []);

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
    mutationFn: async (preset: { name: string; cssOverrides: string; description: string }) => {
      return await apiRequest("POST", "/api/admin/themes", {
        username,
        name: preset.name,
        cssOverrides: preset.cssOverrides,
        description: preset.description,
      });
    },
    onSuccess: (theme) => {
      toast({ title: "Theme added!", description: `${theme.name} has been added to available themes.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setCustomThemeName("");
      setCustomThemeCss("");
      setCustomThemeDesc("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add theme", variant: "destructive" });
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

        {/* Theme Presets */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Theme Presets</CardTitle>
            <CardDescription>Add a preset theme or create your own</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Built-in Presets */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Built-in Presets</h4>
              <div className="space-y-2">
                {THEME_PRESETS.map((preset) => (
                  <div key={preset.name} className="p-3 border rounded-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{preset.name}</h3>
                        <p className="text-xs text-muted-foreground">{preset.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => createThemeMutation.mutate(preset)}
                        disabled={createThemeMutation.isPending || themes.some(t => t.name === preset.name)}
                        data-testid={`button-add-preset-${preset.name.replace(/\s+/g, '-').toLowerCase()}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {themes.some(t => t.name === preset.name) ? "Added" : "Add"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Theme Creator */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Create Custom Preset</h4>
              <div className="space-y-3">
                <Input
                  placeholder="Theme name (e.g., Dark Forest)"
                  value={customThemeName}
                  onChange={(e) => setCustomThemeName(e.target.value)}
                  data-testid="input-custom-theme-name"
                />
                <Input
                  placeholder="Description (e.g., Dark greens with forest vibes)"
                  value={customThemeDesc}
                  onChange={(e) => setCustomThemeDesc(e.target.value)}
                  data-testid="input-custom-theme-desc"
                />
                <Textarea
                  placeholder="CSS variables (e.g., --primary: 120 100% 50%;)"
                  value={customThemeCss}
                  onChange={(e) => setCustomThemeCss(e.target.value)}
                  className="font-mono text-sm"
                  data-testid="textarea-custom-theme-css"
                />
                <Button
                  onClick={() => {
                    if (customThemeName && customThemeCss) {
                      createThemeMutation.mutate({
                        name: customThemeName,
                        cssOverrides: customThemeCss,
                        description: customThemeDesc,
                      });
                    }
                  }}
                  disabled={!customThemeName || !customThemeCss || createThemeMutation.isPending}
                  className="w-full"
                  data-testid="button-create-custom-theme"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Preset
                </Button>
              </div>
            </div>
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
                      {theme.isActive === "true" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => activateThemeMutation.mutate("")}
                          disabled={activateThemeMutation.isPending}
                          data-testid={`button-disable-theme-${theme.id}`}
                        >
                          Disable
                        </Button>
                      ) : (
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
