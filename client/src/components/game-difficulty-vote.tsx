import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GameDifficultyVoteProps {
  gameId: string;
}

export function GameDifficultyVote({ gameId }: GameDifficultyVoteProps) {
  const { toast } = useToast();
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
  const username = localStorage.getItem("username") || "";

  const { data: difficultyData } = useQuery<{
    average: number;
    totalVotes: number;
    votes: unknown[];
  }>({
    queryKey: [`/api/games/${gameId}/difficulty`],
  });

  const voteMutation = useMutation({
    mutationFn: async (difficulty: number) => {
      return await apiRequest("POST", `/api/games/${gameId}/difficulty-vote`, {
        username,
        difficulty,
      });
    },
    onSuccess: () => {
      toast({ title: "Vote recorded!", description: "Thanks for rating this game." });
      setSelectedDifficulty(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit vote", variant: "destructive" });
    },
  });

  const avgDifficulty = difficultyData?.average || 0;

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="font-semibold text-sm">Difficulty Rating</p>
                <p className="text-xs text-muted-foreground">
                  {avgDifficulty > 0 ? `Community avg: ${avgDifficulty}/5` : "No votes yet"}
                </p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">({difficultyData?.totalVotes || 0} votes)</span>
          </div>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((difficulty) => (
              <Button
                key={difficulty}
                variant={selectedDifficulty === difficulty ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedDifficulty(difficulty);
                  voteMutation.mutate(difficulty);
                }}
                disabled={voteMutation.isPending}
                className="flex-1"
                data-testid={`button-difficulty-${difficulty}`}
              >
                {difficulty}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
