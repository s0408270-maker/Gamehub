import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, ShoppingCart, Check, Star, Zap as ZapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cosmetic, UserCosmetic } from "@shared/schema";

// Component to render cosmetic previews
function CosmeticPreview({ cosmetic }: { cosmetic: Cosmetic }) {
  if (cosmetic.type === 'theme') {
    const themeColors: Record<string, { bg: string; text: string; accent: string }> = {
      'cyberpunk': { bg: '#0a0e27', text: '#00ff88', accent: '#ff00ff' },
      'dark_pro': { bg: '#0d0d0d', text: '#e0e0e0', accent: '#666' },
      'forest': { bg: '#1a3a2a', text: '#90ee90', accent: '#228b22' },
      'ocean': { bg: '#001a4d', text: '#87ceeb', accent: '#00bfff' },
      'sunset': { bg: '#2d1b1a', text: '#ffd700', accent: '#ff8c00' },
      'cosmic': { bg: '#1a0033', text: '#b19cd9', accent: '#7b2cbf' },
    };
    const theme = themeColors[cosmetic.value] || themeColors['dark_pro'];
    return (
      <div className="w-full h-48 rounded-lg overflow-hidden" style={{ background: theme.bg }}>
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <div style={{ color: theme.text }} className="text-center space-y-2">
            <p className="text-sm font-semibold">Text Color</p>
            <div className="flex gap-2 justify-center">
              <div className="w-8 h-8 rounded" style={{ background: theme.text }}></div>
              <div className="w-8 h-8 rounded" style={{ background: theme.accent }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  } else if (cosmetic.type === 'badge') {
    const badgeIcons: Record<string, string> = {
      'pro_player': '⭐',
      'speed_runner': '⚡',
      'collector': '🎮',
      'legend': '👑',
      'founder': '🏅',
      'coin_master': '💰',
    };
    const icon = badgeIcons[cosmetic.value] || '✨';
    return (
      <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
        <div className="text-6xl">{icon}</div>
      </div>
    );
  } else if (cosmetic.type === 'profile_frame') {
    const frameStyles: Record<string, string> = {
      'gold_frame': 'border-4 border-yellow-500 shadow-lg shadow-yellow-500/50',
      'pixel_frame': 'border-4 border-purple-400 bg-purple-400/10',
      'neon_frame': 'border-4 border-cyan-400 shadow-lg shadow-cyan-400/50',
      'diamond_frame': 'border-4 border-blue-300 shadow-lg shadow-blue-300/50',
      'fire_frame': 'border-4 border-red-500 shadow-lg shadow-red-500/50',
      'crystal_frame': 'border-4 border-cyan-200 shadow-lg shadow-cyan-200/50',
    };
    const frameClass = frameStyles[cosmetic.value] || frameStyles['gold_frame'];
    return (
      <div className={`w-full h-48 bg-secondary rounded-lg ${frameClass} flex items-center justify-center`}>
        <div className="text-center text-muted-foreground">Frame Preview</div>
      </div>
    );
  } else if (cosmetic.type === 'cursor') {
    const cursorEmojis: Record<string, string> = {
      'sword': '⚔️',
      'fireball': '🔥',
      'lightning': '⚡',
      'meteor': '☄️',
      'ghost': '👻',
      'sparkle': '✨',
      'dragon': '🐉',
      'pixel_heart': '❤️',
    };
    const emoji = cursorEmojis[cosmetic.value] || '🖱️';
    return (
      <div className="w-full h-48 bg-secondary rounded-lg flex items-center justify-center cursor-pointer hover:bg-secondary/80 transition-colors">
        <div className="text-6xl">{emoji}</div>
      </div>
    );
  }
  
  return <div className="w-full h-48 bg-secondary rounded-lg"></div>;
}

export default function CosmeticsShop() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";

  const { data: cosmetics, isLoading } = useQuery<Cosmetic[]>({
    queryKey: ["/api/cosmetics"],
  });

  const { data: userCosmetics } = useQuery({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
  });

  const { data: currentUser } = useQuery({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (cosmeticId: string) => {
      return await apiRequest("POST", "/api/cosmetics/purchase", {
        username,
        cosmeticId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cosmetics"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/cosmetics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
      toast({
        title: "Success!",
        description: "Cosmetic purchased!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to purchase cosmetic",
        variant: "destructive",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (cosmeticId: string | null) => {
      return await apiRequest("POST", "/api/cosmetics/activate", {
        username,
        cosmeticId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/cosmetics`] });
      toast({
        title: "Success!",
        description: "Cosmetic activated!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to activate cosmetic",
        variant: "destructive",
      });
    },
  });

  const ownedIds = new Set(userCosmetics?.owned?.map(uc => uc.cosmeticId) || []);
  const activeId = userCosmetics?.active?.activeCosmeticId;
  const coins = currentUser?.coins || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="text-shop-title">
          Cosmetics Shop
        </h1>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <p className="text-lg font-semibold text-primary" data-testid="text-coins-balance">
            {coins} coins available
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : cosmetics && cosmetics.length > 0 ? (
          cosmetics.map((cosmetic) => {
            const isOwned = ownedIds.has(cosmetic.id);
            const isActive = isOwned && activeId === cosmetic.id;
            const canAfford = coins >= cosmetic.price;

            return (
              <Card key={cosmetic.id} data-testid={`card-cosmetic-${cosmetic.id}`} className="overflow-hidden">
                <CosmeticPreview cosmetic={cosmetic} />
                <CardHeader>
                  <CardTitle className="text-lg">{cosmetic.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{cosmetic.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-bold" data-testid={`text-price-${cosmetic.id}`}>
                        {cosmetic.price}
                      </span>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                      {cosmetic.type}
                    </span>
                  </div>

                  {isOwned ? (
                    <Button
                      onClick={() => activateMutation.mutate(isActive ? null : cosmetic.id)}
                      variant={isActive ? "default" : "outline"}
                      className="w-full"
                      disabled={activateMutation.isPending}
                      data-testid={`button-cosmetic-${cosmetic.id}`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Activated
                        </>
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => purchaseMutation.mutate(cosmetic.id)}
                      disabled={!canAfford || purchaseMutation.isPending}
                      className="w-full"
                      data-testid={`button-buy-${cosmetic.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground" data-testid="text-no-cosmetics">
              No cosmetics available yet
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
