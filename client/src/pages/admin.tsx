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

function generateThemeFromDescription(description: string): string {
  const desc = description.toLowerCase();
  
  // Detect theme characteristics
  const isDark = desc.includes("dark") || desc.includes("black") || desc.includes("night");
  const isLight = desc.includes("light") || desc.includes("white") || desc.includes("bright");
  const hasNeon = desc.includes("neon") || desc.includes("vibrant") || desc.includes("bright") || desc.includes("electric");
  
  // Detect primary color from keywords
  let primaryHue = 200; // default blue
  if (desc.includes("red") || desc.includes("crimson") || desc.includes("ruby")) primaryHue = 0;
  else if (desc.includes("orange") || desc.includes("amber")) primaryHue = 30;
  else if (desc.includes("yellow") || desc.includes("gold")) primaryHue = 50;
  else if (desc.includes("green") || desc.includes("forest") || desc.includes("lime")) primaryHue = 120;
  else if (desc.includes("cyan") || desc.includes("turquoise") || desc.includes("aqua")) primaryHue = 180;
  else if (desc.includes("blue") || desc.includes("ocean") || desc.includes("navy")) primaryHue = 200;
  else if (desc.includes("purple") || desc.includes("violet") || desc.includes("indigo")) primaryHue = 270;
  else if (desc.includes("pink") || desc.includes("magenta")) primaryHue = 320;
  
  // Detect secondary color (complementary or different)
  let secondaryHue = (primaryHue + 120) % 360;
  if (desc.includes("and") && desc.match(/and\s+(\w+)/)) {
    const colorMatch = desc.match(/and\s+(red|orange|yellow|green|cyan|blue|purple|pink)/);
    if (colorMatch) {
      const colors: Record<string, number> = {
        red: 0, orange: 30, yellow: 50, green: 120, cyan: 180, blue: 200, purple: 270, pink: 320,
      };
      secondaryHue = colors[colorMatch[1]] || secondaryHue;
    }
  }
  
  // Detect accent color
  let accentHue = (primaryHue + 60) % 360;
  
  // Saturation
  const saturation = hasNeon ? 100 : 80;
  
  // Lightness for background and text
  const bgLightness = isDark ? 15 : isLight ? 95 : 20;
  const cardLightness = isDark ? 25 : isLight ? 90 : 30;
  const fgLightness = isDark ? 95 : isLight ? 10 : 90;
  const accentSaturation = hasNeon ? 100 : 90;
  const accentLightness = isDark ? 55 : 45;
  
  return `--primary: ${primaryHue} ${saturation}% 50%;
--primary-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--secondary: ${secondaryHue} ${saturation}% 50%;
--secondary-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--accent: ${accentHue} ${accentSaturation}% ${accentLightness}%;
--accent-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--background: ${primaryHue} 30% ${bgLightness}%;
--foreground: ${primaryHue} 30% ${fgLightness}%;
--card: ${primaryHue} 30% ${cardLightness}%;
--border: ${primaryHue} ${saturation}% 50%;`;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [targetUser, setTargetUser] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [customThemeName, setCustomThemeName] = useState("");
  const [customThemeCss, setCustomThemeCss] = useState("");

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
    onSuccess: () => {
      toast({ title: "Theme added!", description: "Theme has been added to available themes." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setCustomThemeName("");
      setCustomThemeCss("");
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to activate theme", variant: "destructive" });
    },
  });

  const disableAllThemesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/themes/disable-all", { username });
    },
    onSuccess: () => {
      toast({ title: "Themes disabled!", description: "Site returned to default colors." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/themes"] });
      setTimeout(() => window.location.reload(), 500);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to disable themes", variant: "destructive" });
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

        {/* Generate Theme from Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Theme from Description</CardTitle>
            <CardDescription>Describe your theme and it will auto-generate the colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Theme name (e.g., Dark Purple)"
              value={customThemeName}
              onChange={(e) => setCustomThemeName(e.target.value)}
              data-testid="input-custom-theme-name"
            />
            <Textarea
              placeholder="Describe your theme (e.g., dark blue with neon accents, bright and vibrant, forest green with gold accents)"
              value={customThemeCss}
              onChange={(e) => setCustomThemeCss(e.target.value)}
              className="min-h-24"
              data-testid="textarea-theme-description"
            />
            <Button
              onClick={() => {
                if (customThemeName && customThemeCss) {
                  const generated = generateThemeFromDescription(customThemeCss);
                  createThemeMutation.mutate({
                    name: customThemeName,
                    cssOverrides: generated,
                    description: customThemeCss,
                  });
                }
              }}
              disabled={!customThemeName || !customThemeCss || createThemeMutation.isPending}
              className="w-full"
              data-testid="button-generate-theme"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createThemeMutation.isPending ? "Generating..." : "Generate Theme"}
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
                      {theme.isActive === "true" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disableAllThemesMutation.mutate()}
                          disabled={disableAllThemesMutation.isPending}
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
