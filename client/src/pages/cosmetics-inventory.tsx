import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, Package, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Cosmetic, UserCosmetic } from "@shared/schema";
import { CosmeticPreview } from "@/components/cosmetic-preview";
import { useState } from "react";

type CosmeticType = "all" | "theme" | "badge" | "profile_frame" | "cursor";

export default function CosmeticsInventory() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<CosmeticType>("all");
  const username = localStorage.getItem("username") || "";

  const { data: userCosmeticsData } = useQuery({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
  });

  const { data: allCosmetics = [] } = useQuery<Cosmetic[]>({
    queryKey: ["/api/cosmetics"],
  });

  const isLoading = !userCosmeticsData;
  const ownedCosmetics = (userCosmeticsData as any)?.owned || [];
  const activeId = (userCosmeticsData as any)?.active?.activeCosmeticId;

  // Map owned cosmetics with their full details
  const userCosmetics = ownedCosmetics.map((uc: UserCosmetic) => {
    const cosmetic = allCosmetics.find(c => c.id === uc.cosmeticId);
    return { ...uc, cosmetic };
  }).filter((uc: any) => uc.cosmetic);

  // Filter cosmetics by selected type
  const filteredCosmetics = selectedType === "all" 
    ? userCosmetics 
    : userCosmetics.filter((uc: any) => uc.cosmetic.type === selectedType);

  // Group cosmetics by type for display
  const groupedByType = filteredCosmetics.reduce((groups: any, uc: any) => {
    const type = uc.cosmetic.type;
    if (!groups[type]) groups[type] = [];
    groups[type].push(uc);
    return groups;
  }, {});

  const typeLabels: Record<string, string> = {
    theme: "Themes",
    badge: "Badges",
    profile_frame: "Profile Frames",
    cursor: "Cursors",
  };

  const equipMutation = useMutation({
    mutationFn: async (cosmeticId: string | null) => {
      return await apiRequest("POST", "/api/cosmetics/activate", { username, cosmeticId });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Cosmetic equipped!" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/cosmetics`] });
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

        {/* Sort Filter */}
        <div className="mb-8 flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 mr-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
          </div>
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("all")}
            data-testid="button-sort-all"
          >
            All ({userCosmetics.length})
          </Button>
          <Button
            variant={selectedType === "theme" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("theme")}
            data-testid="button-sort-theme"
          >
            Themes ({userCosmetics.filter((uc: any) => uc.cosmetic.type === "theme").length})
          </Button>
          <Button
            variant={selectedType === "badge" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("badge")}
            data-testid="button-sort-badge"
          >
            Badges ({userCosmetics.filter((uc: any) => uc.cosmetic.type === "badge").length})
          </Button>
          <Button
            variant={selectedType === "profile_frame" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("profile_frame")}
            data-testid="button-sort-frame"
          >
            Frames ({userCosmetics.filter((uc: any) => uc.cosmetic.type === "profile_frame").length})
          </Button>
          <Button
            variant={selectedType === "cursor" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType("cursor")}
            data-testid="button-sort-cursor"
          >
            Cursors ({userCosmetics.filter((uc: any) => uc.cosmetic.type === "cursor").length})
          </Button>
        </div>

        {filteredCosmetics.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">
                {selectedType === "all" ? "No cosmetics yet" : `No ${typeLabels[selectedType]} found`}
              </p>
              <p className="text-muted-foreground text-center mb-6">
                {selectedType === "all" 
                  ? "Visit the shop to purchase cosmetics and add them to your collection"
                  : `Try a different category or visit the shop to purchase more ${typeLabels[selectedType].toLowerCase()}`}
              </p>
              <a href="/shop">
                <Button data-testid="button-visit-shop">
                  Visit Shop
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div>
            {selectedType === "all" && Object.keys(groupedByType).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedByType).map(([type, items]: [string, any]) => (
                  <div key={type}>
                    <h2 className="text-xl font-semibold mb-4">{typeLabels[type]}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map((uc: any) => (
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
                              {activeId === uc.cosmeticId ? (
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
                                disabled={!activeId || activeId !== uc.cosmeticId}
                                data-testid={`button-unequip-${uc.cosmeticId}`}
                              >
                                Unequip
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCosmetics.map((uc: any) => (
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
                        {activeId === uc.cosmeticId ? (
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
                          disabled={!activeId || activeId !== uc.cosmeticId}
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
        )}
      </div>
    </div>
  );
}
