import { useQuery, useMutation } from "@tanstack/react-query";
import { Zap, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cosmetic, UserCosmetic } from "@shared/schema";

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
              <Card key={cosmetic.id} data-testid={`card-cosmetic-${cosmetic.id}`}>
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
