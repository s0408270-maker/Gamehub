import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppTheme, Announcement, User, Cosmetic, BattlePassTier, Game } from "@shared/schema";
import { Trash2, Plus, Send, ShoppingCart, Upload, Ban, Search, Flame } from "lucide-react";
import { generateThemeFromDescription } from "@/lib/theme-generator";
import { UploadGameForm } from "@/components/upload-game-form";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function OwnerPanel() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [targetUser, setTargetUser] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [customThemeName, setCustomThemeName] = useState("");
  const [customThemeCss, setCustomThemeCss] = useState("");
  const [cosmeticThemeName, setCosmeticThemeName] = useState("");
  const [cosmeticThemeDesc, setCosmeticThemeDesc] = useState("");
  const [cosmeticThemePrice, setCosmeticThemePrice] = useState(100);
  const [premiumGamePrice, setPremiumGamePrice] = useState(50);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banSearchQuery, setBanSearchQuery] = useState("");
  const [battlePassSeason, setBattlePassSeason] = useState(1);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [freeGameFile, setFreeGameFile] = useState<File | null>(null);
  const [freeGameTitle, setFreeGameTitle] = useState("");
  const [premiumGameFile, setPremiumGameFile] = useState<File | null>(null);
  const [premiumGameTitle, setPremiumGameTitle] = useState("");

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

  const { data: currentUser } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/owner/users", username],
    enabled: !!username,
    queryFn: async () => {
      if (!username) return [];
      const res = await fetch(`/api/owner/users?username=${username}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: bpCosmetics = [] } = useQuery<Cosmetic[]>({
    queryKey: ["/api/owner/battlepass/cosmetics", username],
    enabled: !!username,
    queryFn: async () => {
      const res = await fetch(`/api/owner/battlepass/cosmetics?username=${username}`);
      if (!res.ok) throw new Error("Failed to fetch cosmetics");
      return res.json();
    },
  });

  const { data: bpTiers = [] } = useQuery<BattlePassTier[]>({
    queryKey: ["/api/owner/battlepass/tiers", battlePassSeason, username],
    enabled: !!username,
    queryFn: async () => {
      const res = await fetch(`/api/owner/battlepass/${battlePassSeason}/tiers?username=${username}`);
      if (!res.ok) throw new Error("Failed to fetch tiers");
      return res.json();
    },
  });

  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/games"],
    enabled: !!username,
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

  const createThemeCosmeticMutation = useMutation({
    mutationFn: async () => {
      const cssValue = generateThemeFromDescription(cosmeticThemeDesc);
      return await apiRequest("POST", "/api/cosmetics", {
        username,
        name: cosmeticThemeName,
        description: cosmeticThemeDesc,
        type: "theme",
        price: cosmeticThemePrice,
        value: cssValue,
      });
    },
    onSuccess: () => {
      toast({ title: "Theme cosmetic created!", description: "Theme is now available in the shop." });
      queryClient.invalidateQueries({ queryKey: ["/api/cosmetics"] });
      setCosmeticThemeName("");
      setCosmeticThemeDesc("");
      setCosmeticThemePrice(100);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create theme cosmetic", variant: "destructive" });
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

  const banUserMutation = useMutation({
    mutationFn: async (userToBan: string) => {
      return await apiRequest("POST", `/api/owner/users/${userToBan}/ban`, { username });
    },
    onSuccess: () => {
      toast({ title: "User banned!", description: "User can no longer login." });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userToUnban: string) => {
      return await apiRequest("POST", `/api/owner/users/${userToUnban}/unban`, { username });
    },
    onSuccess: () => {
      toast({ title: "User unbanned!", description: "User can login again." });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unban user", variant: "destructive" });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async (data: { tierId: string; freeCosmeticId?: string; premiumCosmeticId?: string; freeGameId?: string; premiumGameId?: string }) => {
      return await apiRequest("PATCH", `/api/owner/battlepass/tier/${data.tierId}`, {
        username,
        freeCosmeticId: data.freeCosmeticId || null,
        premiumCosmeticId: data.premiumCosmeticId || null,
        freeGameId: data.freeGameId || null,
        premiumGameId: data.premiumGameId || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Tier updated!", description: "Battle pass tier has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/battlepass/tiers"] });
      setSelectedTierIndex(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tier", variant: "destructive" });
    },
  });

  // Check if user is owner
  const isOwner = currentUser?.role === "owner";

  if (!isOwner) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You don't have permission to access the owner panel.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-3xl font-bold mb-8" data-testid="heading-owner-panel">
          Owner Panel
        </h1>

        {/* Upload Premium Game */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Upload Premium Game</CardTitle>
            <CardDescription>Create a game that users can purchase with coins</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-open-premium-game-upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Premium Game
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Upload Premium Game</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">Price (coins)</label>
                    <Input
                      type="number"
                      placeholder="Price in coins (e.g., 50)"
                      value={premiumGamePrice}
                      onChange={(e) => setPremiumGamePrice(parseInt(e.target.value) || 0)}
                      min={1}
                      data-testid="input-premium-game-price"
                    />
                  </div>
                  <UploadGameForm 
                    onSuccess={() => {
                      setUploadDialogOpen(false);
                      setPremiumGamePrice(50);
                    }}
                    isPremium={true}
                    premiumPrice={premiumGamePrice}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

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

        {/* Generate Site Theme from Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Site Theme</CardTitle>
            <CardDescription>Create a site-wide theme from a description</CardDescription>
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

        {/* Create Cosmetic Theme for Shop */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle>Create Cosmetic Theme for Shop</CardTitle>
            <CardDescription>Create a sellable theme cosmetic using the theme generator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Theme cosmetic name (e.g., Sunset Paradise)"
              value={cosmeticThemeName}
              onChange={(e) => setCosmeticThemeName(e.target.value)}
              data-testid="input-cosmetic-theme-name"
            />
            <Textarea
              placeholder="Describe the theme colors (e.g., warm orange sunset with golden accents, dark neon purple)"
              value={cosmeticThemeDesc}
              onChange={(e) => setCosmeticThemeDesc(e.target.value)}
              className="min-h-20"
              data-testid="textarea-cosmetic-theme-desc"
            />
            <Input
              type="number"
              placeholder="Price in coins"
              value={cosmeticThemePrice}
              onChange={(e) => setCosmeticThemePrice(parseInt(e.target.value) || 0)}
              min={1}
              data-testid="input-cosmetic-theme-price"
            />
            <Button
              onClick={() => {
                if (cosmeticThemeName && cosmeticThemeDesc && cosmeticThemePrice > 0) {
                  createThemeCosmeticMutation.mutate();
                }
              }}
              disabled={!cosmeticThemeName || !cosmeticThemeDesc || cosmeticThemePrice <= 0 || createThemeCosmeticMutation.isPending}
              className="w-full"
              data-testid="button-create-theme-cosmetic"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {createThemeCosmeticMutation.isPending ? "Creating..." : "Create Theme Cosmetic"}
            </Button>
          </CardContent>
        </Card>

        {/* Ban Users */}
        <Dialog open={isBanModalOpen} onOpenChange={setIsBanModalOpen}>
          <Card className="mb-8 border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle>Ban Users</CardTitle>
              <CardDescription>Block users from accessing the website</CardDescription>
            </CardHeader>
            <CardContent>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-open-ban-modal">
                  <Ban className="w-4 h-4 mr-2" />
                  Manage Bans
                </Button>
              </DialogTrigger>
            </CardContent>
          </Card>

          <DialogContent className="max-w-md max-h-96 flex flex-col">
            <DialogHeader>
              <DialogTitle>Ban Users</DialogTitle>
            </DialogHeader>
            
            <div className="flex items-center gap-2 px-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={banSearchQuery}
                onChange={(e) => setBanSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="input-ban-search"
              />
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {allUsers
                  .filter(u => u.username !== username)
                  .filter(u => u.username.toLowerCase().includes(banSearchQuery.toLowerCase()))
                  .length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">No users found</p>
                ) : (
                  allUsers
                    .filter(u => u.username !== username)
                    .filter(u => u.username.toLowerCase().includes(banSearchQuery.toLowerCase()))
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 hover-elevate rounded-md"
                        data-testid={`user-item-${user.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{user.username}</h3>
                          <p className="text-xs text-muted-foreground">
                            {user.isBanned === "true" ? "BANNED" : "Active"}
                          </p>
                        </div>
                        {user.isBanned === "true" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUserMutation.mutate(user.username)}
                            disabled={unbanUserMutation.isPending}
                            data-testid={`button-unban-${user.id}`}
                            className="ml-2"
                          >
                            Unban
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => banUserMutation.mutate(user.username)}
                            disabled={banUserMutation.isPending}
                            data-testid={`button-ban-${user.id}`}
                            className="ml-2"
                          >
                            Ban
                          </Button>
                        )}
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Battle Pass Management */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              Manage Battle Pass
            </CardTitle>
            <CardDescription>Assign cosmetics and games to battle pass tiers (1-50)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold">Season:</label>
              <Select value={battlePassSeason.toString()} onValueChange={(v) => setBattlePassSeason(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(s => (
                    <SelectItem key={s} value={s.toString()}>Season {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bpTiers.map((tier, idx) => (
                  <Dialog key={tier.id} open={selectedTierIndex === idx} onOpenChange={(open) => setSelectedTierIndex(open ? idx : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="text-xs h-auto py-2" data-testid={`button-tier-${tier.tier}`}>
                        <div className="text-center w-full">
                          <p className="font-bold">Tier {tier.tier}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {(tier.freeCosmeticId || tier.freeGameId) ? "Free" : "Empty"}
                          </p>
                        </div>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Tier {tier.tier}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-semibold block mb-2">Free Cosmetic</label>
                          <Select defaultValue={tier.freeCosmeticId || "none"}>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {bpCosmetics.filter(c => c.id && c.id.trim()).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-2">Premium Cosmetic</label>
                          <Select defaultValue={tier.premiumCosmeticId || "none"}>
                            <SelectTrigger>
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {bpCosmetics.filter(c => c.id && c.id.trim()).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-2">Free Game</label>
                          <div className="space-y-2">
                            <Input
                              placeholder="Game title (optional)"
                              value={freeGameTitle}
                              onChange={(e) => setFreeGameTitle(e.target.value)}
                              className="text-sm"
                              data-testid="input-free-game-title"
                            />
                            <div
                              onClick={() => document.getElementById(`free-game-input-${tier.id}`)?.click()}
                              className="w-full p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors text-center"
                              data-testid="button-upload-free-game"
                            >
                              {freeGameFile ? (
                                <p className="text-sm font-medium">{freeGameFile.name}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Click to upload HTML/SWF game file</p>
                              )}
                            </div>
                            <input
                              id={`free-game-input-${tier.id}`}
                              type="file"
                              accept=".html,.swf"
                              style={{ display: 'none' }}
                              onChange={(e) => setFreeGameFile(e.target.files?.[0] || null)}
                              data-testid="input-free-game-file"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold block mb-2">Premium Game</label>
                          <div className="space-y-2">
                            <Input
                              placeholder="Game title (optional)"
                              value={premiumGameTitle}
                              onChange={(e) => setPremiumGameTitle(e.target.value)}
                              className="text-sm"
                              data-testid="input-premium-game-title"
                            />
                            <div
                              onClick={() => document.getElementById(`premium-game-input-${tier.id}`)?.click()}
                              className="w-full p-4 border-2 border-dashed border-border rounded-md cursor-pointer hover:bg-secondary/50 transition-colors text-center"
                              data-testid="button-upload-premium-game"
                            >
                              {premiumGameFile ? (
                                <p className="text-sm font-medium">{premiumGameFile.name}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Click to upload HTML/SWF game file</p>
                              )}
                            </div>
                            <input
                              id={`premium-game-input-${tier.id}`}
                              type="file"
                              accept=".html,.swf"
                              style={{ display: 'none' }}
                              onChange={(e) => setPremiumGameFile(e.target.files?.[0] || null)}
                              data-testid="input-premium-game-file"
                            />
                          </div>
                        </div>
                        <Button onClick={async () => {
                          let freeGameId = tier.freeGameId;
                          let premiumGameId = tier.premiumGameId;

                          // Upload free game if file was selected
                          if (freeGameFile) {
                            const formData = new FormData();
                            formData.append("title", freeGameTitle || freeGameFile.name);
                            formData.append("gameFile", freeGameFile);
                            formData.append("username", username);
                            try {
                              const res = await fetch("/api/games", { method: "POST", body: formData });
                              if (res.ok) {
                                const game = await res.json();
                                freeGameId = game.id;
                                setFreeGameFile(null);
                                setFreeGameTitle("");
                              }
                            } catch (e) {
                              toast({ title: "Error", description: "Failed to upload free game", variant: "destructive" });
                              return;
                            }
                          }

                          // Upload premium game if file was selected
                          if (premiumGameFile) {
                            const formData = new FormData();
                            formData.append("title", premiumGameTitle || premiumGameFile.name);
                            formData.append("gameFile", premiumGameFile);
                            formData.append("username", username);
                            try {
                              const res = await fetch("/api/games", { method: "POST", body: formData });
                              if (res.ok) {
                                const game = await res.json();
                                premiumGameId = game.id;
                                setPremiumGameFile(null);
                                setPremiumGameTitle("");
                              }
                            } catch (e) {
                              toast({ title: "Error", description: "Failed to upload premium game", variant: "destructive" });
                              return;
                            }
                          }

                          updateTierMutation.mutate({ 
                            tierId: tier.id, 
                            freeCosmeticId: tier.freeCosmeticId || undefined, 
                            premiumCosmeticId: tier.premiumCosmeticId || undefined, 
                            freeGameId: freeGameId || undefined, 
                            premiumGameId: premiumGameId || undefined 
                          });
                        }} disabled={updateTierMutation.isPending} className="w-full" data-testid={`button-save-tier-${tier.tier}`}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </ScrollArea>
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
