import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, ShoppingCart, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Game } from "@shared/schema";

export default function PremiumGamesShop() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";

  const { data: allGames = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const { data: ownedGameIds = [] } = useQuery<string[]>({
    queryKey: [`/api/users/${username}/owned-games`],
    enabled: !!username,
  });

  const { data: currentUser } = useQuery({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await apiRequest("POST", `/api/games/${gameId}/purchase`, { username });
    },
    onSuccess: (data: any) => {
      toast({ title: "Success!", description: "Game purchased! You can now play it." });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/owned-games`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to purchase game",
        variant: "destructive",
      });
    },
  });

  // Filter only premium games
  const premiumGames = allGames.filter(g => g.price && g.price > 0);
  const coins = currentUser?.coins || 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Premium Games</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-full" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="text-shop-title">
          Premium Games
        </h1>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <p className="text-lg font-semibold text-primary" data-testid="text-coins-balance">
            {coins} coins available
          </p>
        </div>
      </div>

      {premiumGames.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No premium games available yet
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {premiumGames.map((game) => {
            const isOwned = ownedGameIds.includes(game.id);
            const canAfford = coins >= (game.price || 0);

            return (
              <Card key={game.id} data-testid={`card-game-${game.id}`} className="overflow-hidden">
                {game.thumbnail && (
                  <img src={game.thumbnail} alt={game.title} className="w-full h-48 object-cover" />
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-bold" data-testid={`text-price-${game.id}`}>
                        {game.price}
                      </span>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                      {game.gameType}
                    </span>
                  </div>

                  {isOwned ? (
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled
                      data-testid={`button-owned-${game.id}`}
                    >
                      Owned
                    </Button>
                  ) : (
                    <Button
                      onClick={() => purchaseMutation.mutate(game.id)}
                      disabled={!canAfford || purchaseMutation.isPending}
                      className="w-full"
                      data-testid={`button-buy-${game.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
