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
    // THEME PREVIEWS - Show full UI mockup
    const themes: Record<string, JSX.Element> = {
      'cyberpunk': (
        <div className="w-full h-48 bg-black overflow-hidden">
          <div className="grid grid-cols-2 h-full gap-px bg-cyan-500">
            <div className="bg-purple-900 flex items-center justify-center"><div className="text-cyan-400 font-bold text-xl">▌</div></div>
            <div className="bg-black flex items-center justify-center"><div className="text-pink-500 text-xl">◆</div></div>
            <div className="bg-black flex items-center justify-center"><div className="text-cyan-400 text-xl">◆</div></div>
            <div className="bg-purple-900 flex items-center justify-center"><div className="text-pink-500 font-bold">▌</div></div>
          </div>
        </div>
      ),
      'dark_pro': (
        <div className="w-full h-48 bg-neutral-900 flex flex-col">
          <div className="h-1/3 bg-neutral-800 border-b border-neutral-700 flex items-center px-4">
            <div className="text-neutral-400 text-sm">Header</div>
          </div>
          <div className="h-2/3 bg-neutral-900 p-4 space-y-3">
            <div className="h-6 bg-neutral-800 rounded"></div>
            <div className="h-6 bg-neutral-800 rounded w-2/3"></div>
            <div className="h-6 bg-neutral-800 rounded w-1/2"></div>
          </div>
        </div>
      ),
      'forest': (
        <div className="w-full h-48 bg-green-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="text-6xl">🌲🌲🌲</div>
          </div>
          <div className="text-green-300 text-2xl font-bold z-10">Forest</div>
        </div>
      ),
      'ocean': (
        <div className="w-full h-48 bg-blue-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-blue-400 to-blue-900"></div>
          <div className="absolute bottom-0 w-full h-1/2 bg-blue-900"></div>
          <div className="z-10 text-blue-300 text-xl">≈≈≈ Ocean Waves ≈≈≈</div>
        </div>
      ),
      'sunset': (
        <div className="w-full h-48 bg-gradient-to-b from-orange-900 via-yellow-700 to-red-900 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-yellow-400 shadow-2xl shadow-yellow-400/50"></div>
        </div>
      ),
      'cosmic': (
        <div className="w-full h-48 bg-purple-950 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 text-2xl opacity-40">✦ ✧ ✦ ✧</div>
          <div className="text-purple-300 text-xl font-semibold z-10">Cosmic Space</div>
        </div>
      ),
    };
    return themes[cosmetic.value] || themes['dark_pro'];
  } else if (cosmetic.type === 'badge') {
    // BADGE PREVIEWS - Styled badge designs
    const badges: Record<string, JSX.Element> = {
      'pro_player': (
        <div className="w-full h-48 bg-gradient-to-br from-yellow-900 to-red-900 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">⭐</div>
            <div className="text-yellow-200 font-bold text-lg">PRO</div>
          </div>
        </div>
      ),
      'speed_runner': (
        <div className="w-full h-48 bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center rounded-lg relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 text-lg">→→→→→</div>
          <div className="flex flex-col items-center gap-2 z-10">
            <div className="text-5xl">⚡</div>
            <div className="text-cyan-100 font-bold">SPEED</div>
          </div>
        </div>
      ),
      'collector': (
        <div className="w-full h-48 bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">📚</div>
            <div className="text-purple-200 font-bold">COLLECTOR</div>
          </div>
        </div>
      ),
      'legend': (
        <div className="w-full h-48 bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center rounded-lg shadow-2xl shadow-yellow-500/50">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">👑</div>
            <div className="text-amber-100 font-bold text-lg">LEGEND</div>
          </div>
        </div>
      ),
      'founder': (
        <div className="w-full h-48 bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center rounded-lg border-2 border-gold-300">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">🏅</div>
            <div className="text-blue-100 font-bold">FOUNDER</div>
          </div>
        </div>
      ),
      'coin_master': (
        <div className="w-full h-48 bg-gradient-to-br from-yellow-600 to-yellow-900 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">💰</div>
            <div className="text-yellow-100 font-bold">COIN MASTER</div>
          </div>
        </div>
      ),
    };
    return badges[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
  } else if (cosmetic.type === 'profile_frame') {
    // FRAME PREVIEWS - Ornate borders
    const frames: Record<string, JSX.Element> = {
      'gold_frame': (
        <div className="w-full h-48 bg-secondary rounded-lg border-4 border-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 relative">
          <div className="absolute inset-2 border-2 border-yellow-400 rounded-sm"></div>
          <div className="text-yellow-400 font-bold z-10">Gold Frame</div>
        </div>
      ),
      'pixel_frame': (
        <div className="w-full h-48 bg-purple-900/30 rounded-lg flex items-center justify-center relative" style={{backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(168, 85, 247, 0.1) 2px, rgba(168, 85, 247, 0.1) 4px)'}}>
          <div className="border-4 border-purple-400 w-full h-full flex items-center justify-center" style={{background: 'rgba(168, 85, 247, 0.05)'}}></div>
          <div className="absolute text-purple-300 font-bold">Pixel Art</div>
        </div>
      ),
      'neon_frame': (
        <div className="w-full h-48 bg-black rounded-lg border-4 border-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-400/50">
          <div className="text-cyan-300 font-bold">Neon Glow</div>
        </div>
      ),
      'diamond_frame': (
        <div className="w-full h-48 bg-blue-900/20 rounded-lg border-4 border-blue-300 flex items-center justify-center shadow-lg shadow-blue-400/40 relative">
          <div className="text-blue-200 font-bold">✦ Diamond ✦</div>
        </div>
      ),
      'fire_frame': (
        <div className="w-full h-48 bg-red-950/30 rounded-lg border-4 border-red-500 flex items-center justify-center shadow-lg shadow-red-500/50 relative">
          <div className="absolute inset-0 opacity-20 text-2xl animate-pulse">🔥🔥🔥</div>
          <div className="text-red-300 font-bold z-10">Fire Frame</div>
        </div>
      ),
      'crystal_frame': (
        <div className="w-full h-48 bg-cyan-900/20 rounded-lg border-4 border-cyan-200 flex items-center justify-center shadow-lg shadow-cyan-300/30">
          <div className="text-cyan-200 font-bold">◆ Crystal ◆</div>
        </div>
      ),
    };
    return frames[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
  } else if (cosmetic.type === 'cursor') {
    // CURSOR PREVIEWS - Detailed cursor designs
    const cursors: Record<string, JSX.Element> = {
      'sword': (
        <div className="w-full h-48 bg-amber-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-amber-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">⚔️</div>
            <div className="text-amber-700 font-bold">Sword Cursor</div>
          </div>
        </div>
      ),
      'fireball': (
        <div className="w-full h-48 bg-red-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-red-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2 animate-pulse">🔥</div>
            <div className="text-red-600 font-bold">Fireball</div>
          </div>
        </div>
      ),
      'lightning': (
        <div className="w-full h-48 bg-yellow-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-yellow-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">⚡</div>
            <div className="text-yellow-600 font-bold">Lightning</div>
          </div>
        </div>
      ),
      'meteor': (
        <div className="w-full h-48 bg-orange-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-orange-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">☄️</div>
            <div className="text-orange-600 font-bold">Meteor</div>
          </div>
        </div>
      ),
      'ghost': (
        <div className="w-full h-48 bg-purple-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-purple-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2 opacity-60">👻</div>
            <div className="text-purple-400 font-bold">Ghost</div>
          </div>
        </div>
      ),
      'sparkle': (
        <div className="w-full h-48 bg-pink-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-pink-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2 animate-pulse">✨</div>
            <div className="text-pink-400 font-bold">Sparkle</div>
          </div>
        </div>
      ),
      'dragon': (
        <div className="w-full h-48 bg-green-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-green-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">🐉</div>
            <div className="text-green-600 font-bold">Dragon</div>
          </div>
        </div>
      ),
      'pixel_heart': (
        <div className="w-full h-48 bg-red-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-red-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">❤️</div>
            <div className="text-red-500 font-bold">Pixel Heart</div>
          </div>
        </div>
      ),
    };
    return cursors[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
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
