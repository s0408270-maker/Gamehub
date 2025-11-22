import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cosmetic, UserCosmetic } from "@shared/schema";
import { CosmeticPreview } from "@/components/cosmetic-preview";

export default function CosmeticsInventory() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";

  const { data: userCosmetics = [], isLoading } = useQuery<(UserCosmetic & { cosmetic: Cosmetic })[]>({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
  });

  const { data: activeCosmetic } = useQuery<{ cosmeticId: string | null } | null>({
    queryKey: [`/api/users/${username}/active-cosmetic`],
    enabled: !!username,
  });

  const equipMutation = useMutation({
    mutationFn: async (cosmeticId: string | null) => {
      return await apiRequest("POST", `/api/users/${username}/active-cosmetic`, { cosmeticId });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Cosmetic equipped!" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/active-cosmetic`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to equip cosmetic", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold mb-8" data-testid="heading-inventory">
            Cosmetics Inventory
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-inventory">
              Cosmetics Inventory
            </h1>
            <p className="text-muted-foreground mt-1">
              {userCosmetics.length} item{userCosmetics.length !== 1 ? "s" : ""} owned
            </p>
          </div>
          <Package className="w-10 h-10 text-primary opacity-50" />
        </div>

        {userCosmetics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">No cosmetics yet</p>
              <p className="text-muted-foreground text-center mb-6">
                Visit the shop to purchase cosmetics and add them to your collection
              </p>
              <a href="/shop">
                <Button data-testid="button-visit-shop">
                  Visit Shop
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userCosmetics.map((uc) => (
              <Card key={uc.id} className="overflow-hidden hover-elevate" data-testid={`card-cosmetic-${uc.cosmeticId}`}>
                <CardContent className="p-0">
                  <CosmeticPreview cosmetic={uc.cosmetic} />
                </CardContent>
                <CardHeader className="space-y-2">
                  <CardTitle className="text-lg">{uc.cosmetic.name}</CardTitle>
                  {uc.cosmetic.description && (
                    <p className="text-sm text-muted-foreground">{uc.cosmetic.description}</p>
                  )}
                  <div className="pt-2 space-y-2">
                    {activeCosmetic?.cosmeticId === uc.cosmeticId ? (
                      <Button
                        variant="secondary"
                        className="w-full"
                        disabled
                        data-testid={`button-equipped-${uc.cosmeticId}`}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        Equipped
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => equipMutation.mutate(uc.cosmeticId)}
                        disabled={equipMutation.isPending}
                        data-testid={`button-equip-${uc.cosmeticId}`}
                      >
                        Equip
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => equipMutation.mutate(null)}
                      disabled={!activeCosmetic?.cosmeticId || activeCosmetic.cosmeticId !== uc.cosmeticId}
                      data-testid={`button-unequip-${uc.cosmeticId}`}
                    >
                      Unequip
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
