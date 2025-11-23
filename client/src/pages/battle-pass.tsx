import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, Lock, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WatchAdModal } from "@/components/watch-ad-modal";
import { DisplayAdUnit } from "@/components/ad-unit";

export default function BattlePass() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [adModalOpen, setAdModalOpen] = useState(false);

  const { data: userData } = useQuery<{ role: string }>({
    queryKey: [`/api/user/${username}`],
  });

  const { data: battlePassData, isLoading } = useQuery<{
    progress: { currentSeason: number; currentTier: number; experience: number; hasPremiumPass: string };
    tiers: unknown[];
    claimedRewards: string[];
  }>({
    queryKey: [`/api/battlepass/${username}`],
  });

  const isOwner = userData?.role === "owner";

  const watchAdMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/battlepass/${username}/watch-ad`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/battlepass/${username}`] });
      toast({ title: "Success", description: "Tier unlocked!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unlock tier", variant: "destructive" });
    },
  });

  const changeSeasonMutation = useMutation({
    mutationFn: async (season: number) => {
      return await apiRequest("POST", `/api/battlepass/${username}/change-season`, { season });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/battlepass/${username}`] });
      toast({ title: "Success", description: "Season changed!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to change season", variant: "destructive" });
    },
  });

  const claimRewardMutation = useMutation({
    mutationFn: async ({ tierId, season }: { tierId: string; season: number }) => {
      return await apiRequest("POST", `/api/battlepass/${username}/claim-reward`, { tierId, season });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/battlepass/${username}`] });
      toast({ title: "Success", description: "Reward claimed!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to claim reward", variant: "destructive" });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/battlepass/${username}/purchase-premium`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/battlepass/${username}`] });
      toast({ title: "Success", description: "Premium pass purchased!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to purchase premium pass", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!battlePassData) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Battle Pass</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Unable to load battle pass</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { progress, tiers } = battlePassData;
  const nextTierXp = 500;
  const tierProgress = ((progress.experience || 0) / nextTierXp) * 100;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">Battle Pass</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="default" className="text-lg px-4 py-2" data-testid="badge-season">
              Season {progress.currentSeason}
            </Badge>
            {isOwner && (
              <Select value={String(progress.currentSeason)} onValueChange={(value) => changeSeasonMutation.mutate(parseInt(value))}>
                <SelectTrigger className="w-40" data-testid="select-season">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((season) => (
                    <SelectItem key={season} value={String(season)} data-testid={`option-season-${season}`}>
                      Season {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tier {progress.currentTier} of 50</span>
              <div className="flex items-center gap-2">
                {progress.currentTier < 50 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdModalOpen(true)}
                    disabled={watchAdMutation.isPending}
                    data-testid="button-watch-ad"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {watchAdMutation.isPending ? "Unlocking..." : "Watch Ad (+1 Tier)"}
                  </Button>
                )}
                {progress.hasPremiumPass === "true" ? (
                  <Badge variant="default">Premium Pass</Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => purchaseMutation.mutate()}
                    disabled={purchaseMutation.isPending}
                    data-testid="button-buy-premium"
                  >
                    {purchaseMutation.isPending ? "Buying..." : "Buy Premium (500 Coins)"}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Tier Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress.experience || 0} / {nextTierXp} XP
                </span>
              </div>
              <Progress value={tierProgress} className="h-3" data-testid="progress-tier-xp" />
            </div>
          </CardContent>
        </Card>

        {/* Tiers Grid */}
        <h2 className="text-2xl font-bold mb-4">Rewards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {(battlePassData?.tiers || []).map((tier: any) => {
            const tierNum = tier.tier;
            const isReached = progress.currentTier >= tierNum;
            const isCurrent = progress.currentTier === tierNum;
            const isClaimed = battlePassData.claimedRewards?.includes(tier.id) || false;

            return (
              <Card
                key={tierNum}
                className={`text-center transition-all ${
                  isReached ? "bg-primary/10" : "opacity-50"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                data-testid={`card-tier-${tierNum}`}
              >
                <CardContent className="p-3 flex flex-col gap-2">
                  <div className="text-xs font-bold">Tier {tierNum}</div>
                  {isReached ? (
                    <Star className="w-6 h-6 text-yellow-500 mx-auto" />
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
                  )}
                  {isReached && !isClaimed && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => claimRewardMutation.mutate({ tierId: tier.id, season: progress.currentSeason })}
                      disabled={claimRewardMutation.isPending}
                      data-testid={`button-claim-tier-${tierNum}`}
                    >
                      {claimRewardMutation.isPending ? "Claiming..." : "Collect"}
                    </Button>
                  )}
                  {isClaimed && (
                    <Badge variant="secondary" className="text-xs">
                      Claimed
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Ad Unit */}
        <DisplayAdUnit />

        {/* Info */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Complete games to earn experience and progress through the battle pass. Watch ads to unlock tiers instantly! Premium pass holders get bonus rewards!
            </p>
          </CardContent>
        </Card>
      </div>

      <WatchAdModal
        open={adModalOpen}
        onOpenChange={setAdModalOpen}
        onAdComplete={() => watchAdMutation.mutate()}
        isLoading={watchAdMutation.isPending}
      />
    </div>
  );
}
