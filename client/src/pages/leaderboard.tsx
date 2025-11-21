import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  const getMedalIcon = (rank: number) => {
    if (rank === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-orange-600" />;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="text-leaderboard-title">
          Top Players
        </h1>
        <p className="text-muted-foreground" data-testid="text-leaderboard-subtitle">
          Earn coins by playing games - 5 coins per minute of gameplay!
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-6 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : leaderboard && leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <Card key={user.id} data-testid={`card-leaderboard-${index}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary font-bold text-lg flex-shrink-0">
                    {getMedalIcon(index) || <span>#{index + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate" data-testid={`text-username-${index}`}>
                      {user.username}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-primary" data-testid={`text-coins-${index}`}>
                      {user.coins || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">coins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground" data-testid="text-no-data">
              No players yet. Start playing to join the leaderboard!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
