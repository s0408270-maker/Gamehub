import { MoreVertical, Star, Flag, Heart, Share2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Game } from "@shared/schema";

interface GameOptionsMenuProps {
  game: Game & { creatorUsername?: string };
  createdBy: string;
}

export function GameOptionsMenu({ game, createdBy }: GameOptionsMenuProps) {
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [gameRating, setGameRating] = useState(0);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const creatorUsername = (game as any).creatorUsername || "Unknown";

  const rateGameMutation = useMutation({
    mutationFn: async () => {
      if (gameRating === 0 && difficultyRating === 0) {
        throw new Error("Please rate at least one aspect");
      }
      if (difficultyRating > 0) {
        return await apiRequest("POST", `/api/games/${game.id}/rate-difficulty`, {
          username,
          difficulty: difficultyRating,
        });
      }
      return null;
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Rating submitted" });
      setRatingDialogOpen(false);
      setGameRating(0);
      setDifficultyRating(0);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit rating", variant: "destructive" });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/block`, {
        username,
        blockUsername: creatorUsername,
      });
    },
    onSuccess: () => {
      toast({ title: "Blocked", description: `Blocked ${creatorUsername}` });
      setBlockDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users/blocked"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to block user", variant: "destructive" });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/games/${game.id}/favorite`, { username });
    },
    onSuccess: () => {
      toast({ title: "Added to Favorites", description: game.title });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 left-2 z-10"
            data-testid="button-game-options"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setRatingDialogOpen(true)} data-testid="menu-rate-game">
            <Star className="w-4 h-4 mr-2" />
            Rate Game & Difficulty
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => addToFavoritesMutation.mutate()}
            disabled={addToFavoritesMutation.isPending}
            data-testid="menu-add-favorite"
          >
            <Heart className="w-4 h-4 mr-2" />
            Add to Favorites
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              navigator.share?.({
                title: game.title,
                text: `Check out ${game.title} on GameHub!`,
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
                toast({ title: "Copied", description: "Game link copied to clipboard" });
              });
            }}
            data-testid="menu-share"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Game
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setBlockDialogOpen(true)} className="text-destructive" data-testid="menu-block">
            <Ban className="w-4 h-4 mr-2" />
            Block {createdBy}
          </DropdownMenuItem>

          <DropdownMenuItem className="text-destructive" data-testid="menu-report">
            <Flag className="w-4 h-4 mr-2" />
            Report Game
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rate {game.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Difficulty (1-5 stars)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setDifficultyRating(star)}
                    className={`text-2xl transition-colors ${
                      difficultyRating >= star ? "text-yellow-400" : "text-gray-300"
                    }`}
                    data-testid={`button-difficulty-${star}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={() => rateGameMutation.mutate()}
              disabled={rateGameMutation.isPending || difficultyRating === 0}
              className="w-full"
              data-testid="button-submit-rating"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Block {createdBy}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            You won't see games from {createdBy} and they can't contact you.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => blockUserMutation.mutate()}
              disabled={blockUserMutation.isPending}
              className="flex-1"
              data-testid="button-confirm-block"
            >
              Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
