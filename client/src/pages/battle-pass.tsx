import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function BattlePass() {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";

  const { data: battlePassData, isLoading } = useQuery({
    queryKey: [`/api/battlepass/${username}`],
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
          <Badge variant="default" className="text-lg px-4 py-2">
            Season {progress.currentSeason}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tier {progress.currentTier} of 50</span>
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
          {Array.from({ length: 50 }).map((_, i) => {
            const tierNum = i + 1;
            const isReached = progress.currentTier >= tierNum;
            const isCurrent = progress.currentTier === tierNum;

            return (
              <Card
                key={tierNum}
                className={`text-center cursor-pointer transition-all ${
                  isReached ? "bg-primary/10" : "opacity-50"
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                data-testid={`card-tier-${tierNum}`}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-xs font-bold mb-2">Tier {tierNum}</div>
                  {isReached ? (
                    <Star className="w-6 h-6 text-yellow-500 mx-auto" />
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info */}
        <Card className="mt-8 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Complete games to earn experience and progress through the battle pass. Premium pass holders get bonus rewards!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
