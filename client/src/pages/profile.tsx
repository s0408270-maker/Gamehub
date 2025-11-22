import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Mail, Coins, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, Cosmetic, UserCosmetic } from "@shared/schema";

export default function Profile() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username || localStorage.getItem("username") || "";
  const currentUsername = localStorage.getItem("username") || "";
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  const { data: userCosmeticsData } = useQuery({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
  });

  const { data: allCosmetics = [] } = useQuery<Cosmetic[]>({
    queryKey: ["/api/cosmetics"],
  });

  const ownedCosmetics = (userCosmeticsData as any)?.owned || [];
  const activeCosmeticId = (userCosmeticsData as any)?.active?.activeCosmeticId;

  // Get cosmetics by type
  const frameCosmetics = ownedCosmetics
    .map((uc: UserCosmetic) => {
      const cosmetic = allCosmetics.find(c => c.id === uc.cosmeticId);
      return { ...uc, cosmetic };
    })
    .filter((uc: any) => uc.cosmetic?.type === "profile_frame");

  const badgeCosmetics = ownedCosmetics
    .map((uc: UserCosmetic) => {
      const cosmetic = allCosmetics.find(c => c.id === uc.cosmeticId);
      return { ...uc, cosmetic };
    })
    .filter((uc: any) => uc.cosmetic?.type === "badge");

  const cursorCosmetics = ownedCosmetics
    .map((uc: UserCosmetic) => {
      const cosmetic = allCosmetics.find(c => c.id === uc.cosmeticId);
      return { ...uc, cosmetic };
    })
    .filter((uc: any) => uc.cosmetic?.type === "cursor");

  const frameCosmetic = allCosmetics.find(c => c.id === (userCosmeticsData as any)?.active?.frameId);
  const badgeCosmetic = allCosmetics.find(c => c.id === (userCosmeticsData as any)?.active?.badgeId);
  const cursorCosmetic = allCosmetics.find(c => c.id === (userCosmeticsData as any)?.active?.cursorId);

  const updateCosmeticMutation = useMutation({
    mutationFn: async ({ type, cosmeticId }: { type: string; cosmeticId: string | null }) => {
      return await apiRequest("POST", "/api/cosmetics/update-profile", {
        username,
        type,
        cosmeticId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Profile updated!" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/cosmetics`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/block`, {
        username: currentUsername,
        blockUsername: username,
      });
    },
    onSuccess: () => {
      toast({ title: "Blocked", description: `Blocked ${username}` });
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to block user", variant: "destructive" });
    },
  });

  const isOwnProfile = username === currentUsername;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-12 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-6" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" />
          Back to Games
        </a>

        {/* Profile Header */}
        <Card className="mb-6" data-frame={frameCosmetic?.value || undefined} data-testid="card-profile-header">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{user.username}</CardTitle>
                <p className="text-muted-foreground flex items-center gap-2 mt-2">
                  <Coins className="w-4 h-4" />
                  {user.coins || 0} coins
                </p>
              </div>
              <div className="flex items-center gap-2">
                {user.isBanned === "true" && (
                  <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                    Banned
                  </span>
                )}
                {!isOwnProfile && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => blockUserMutation.mutate()}
                    disabled={blockUserMutation.isPending}
                    data-testid="button-block-user"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Block
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cosmetics Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Profile Frame */}
          <Card data-testid="card-profile-frame">
            <CardHeader>
              <CardTitle className="text-lg">Profile Frame</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {frameCosmetic && (
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{frameCosmetic.name}</p>
                  <p className="text-muted-foreground text-xs">{frameCosmetic.description}</p>
                </div>
              )}
              {!frameCosmetic && <p className="text-muted-foreground text-sm">None equipped</p>}

              {isOwnProfile && frameCosmetics.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-edit-frame">
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-select-frame">
                    <DialogHeader>
                      <DialogTitle>Select Profile Frame</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant={!frameCosmetic ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => updateCosmeticMutation.mutate({ type: "frame", cosmeticId: null })}
                        data-testid="button-remove-frame"
                      >
                        None
                      </Button>
                      {frameCosmetics.map((uc: any) => (
                        <Button
                          key={uc.id}
                          variant={frameCosmetic?.id === uc.cosmeticId ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => updateCosmeticMutation.mutate({ type: "frame", cosmeticId: uc.cosmeticId })}
                          data-testid={`button-select-frame-${uc.cosmeticId}`}
                        >
                          {uc.cosmetic.name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Badge/Charm */}
          <Card data-testid="card-profile-badge">
            <CardHeader>
              <CardTitle className="text-lg">Badge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {badgeCosmetic && (
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{badgeCosmetic.name}</p>
                  <p className="text-muted-foreground text-xs">{badgeCosmetic.description}</p>
                </div>
              )}
              {!badgeCosmetic && <p className="text-muted-foreground text-sm">None equipped</p>}

              {isOwnProfile && badgeCosmetics.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-edit-badge">
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-select-badge">
                    <DialogHeader>
                      <DialogTitle>Select Badge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant={!badgeCosmetic ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => updateCosmeticMutation.mutate({ type: "badge", cosmeticId: null })}
                        data-testid="button-remove-badge"
                      >
                        None
                      </Button>
                      {badgeCosmetics.map((uc: any) => (
                        <Button
                          key={uc.id}
                          variant={badgeCosmetic?.id === uc.cosmeticId ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => updateCosmeticMutation.mutate({ type: "badge", cosmeticId: uc.cosmeticId })}
                          data-testid={`button-select-badge-${uc.cosmeticId}`}
                        >
                          {uc.cosmetic.name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Cursor */}
          <Card data-testid="card-profile-cursor">
            <CardHeader>
              <CardTitle className="text-lg">Cursor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cursorCosmetic && (
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{cursorCosmetic.name}</p>
                  <p className="text-muted-foreground text-xs">{cursorCosmetic.description}</p>
                </div>
              )}
              {!cursorCosmetic && <p className="text-muted-foreground text-sm">None equipped</p>}

              {isOwnProfile && cursorCosmetics.length > 0 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" data-testid="button-edit-cursor">
                      Change
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="dialog-select-cursor">
                    <DialogHeader>
                      <DialogTitle>Select Cursor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Button
                        variant={!cursorCosmetic ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => updateCosmeticMutation.mutate({ type: "cursor", cosmeticId: null })}
                        data-testid="button-remove-cursor"
                      >
                        None
                      </Button>
                      {cursorCosmetics.map((uc: any) => (
                        <Button
                          key={uc.id}
                          variant={cursorCosmetic?.id === uc.cosmeticId ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => updateCosmeticMutation.mutate({ type: "cursor", cosmeticId: uc.cosmeticId })}
                          data-testid={`button-select-cursor-${uc.cosmeticId}`}
                        >
                          {uc.cosmetic.name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
