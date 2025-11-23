import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface URLGamePlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function URLGamePlayer({ open, onOpenChange }: URLGamePlayerProps) {
  const [gameUrl, setGameUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePlay = () => {
    if (!gameUrl.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    try {
      new URL(gameUrl);
      setIsPlaying(true);
      setError("");
      setLoading(true);
    } catch {
      setError("Invalid URL format");
    }
  };

  const handleClose = () => {
    setIsPlaying(false);
    setGameUrl("");
    setError("");
    setLoading(false);
    onOpenChange(false);
  };

  if (isPlaying) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-6xl h-[95vh] p-0 border-0">
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
              data-testid="button-close-url-game"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40 rounded-lg">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <p className="text-white">Loading game...</p>
              </div>
            </div>
          )}

          <iframe
            src={gameUrl}
            className="w-full h-full border-0 rounded-lg"
            title="External Game"
            allowFullScreen
            allow="autoplay; microphone; camera; encrypted-media; accelerometer; gyroscope; payment; usb; vr; clipboard-read; clipboard-write"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("Failed to load game from URL");
              setLoading(false);
            }}
            data-testid="iframe-url-game"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">
            Play Game from URL
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Game URL</label>
            <Input
              placeholder="https://example.com/game"
              value={gameUrl}
              onChange={(e) => {
                setGameUrl(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePlay()}
              data-testid="input-game-url"
              className="w-full"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <p className="text-sm text-muted-foreground">
            Enter any game URL to play it directly in PixelPlex. Note: Game
            progress may not save for external games.
          </p>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlay} data-testid="button-play-url-game">
              <span>Play</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
