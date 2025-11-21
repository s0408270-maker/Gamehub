import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { useEffect, useState } from "react";

interface GamePlayerModalProps {
  game: Game;
  open: boolean;
  onClose: () => void;
}

export function GamePlayerModal({ game, open, onClose }: GamePlayerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  // Fetch game HTML and create blob URL for secure loading
  useEffect(() => {
    if (!open) return;

    let objectUrl: string | null = null;

    const loadGame = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/play/${game.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to load game");
        }

        const htmlBlob = await response.blob();
        objectUrl = URL.createObjectURL(htmlBlob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error("Error loading game:", err);
        setError("Failed to load game. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadGame();

    // Cleanup blob URL when modal closes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setBlobUrl(null);
    };
  }, [open, game.id]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
      data-testid="modal-game-player"
    >
      <div 
        className="relative w-full max-w-7xl h-[90vh] sm:h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-4 px-2 sm:px-4">
          <h2 className="text-lg sm:text-2xl font-bold text-white truncate pr-2" data-testid="text-playing-game-title">
            {game.title}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 flex-shrink-0"
            onClick={onClose}
            data-testid="button-close-player"
          >
            <X className="w-5 sm:w-6 h-5 sm:h-6" />
          </Button>
        </div>

        {/* Game iframe */}
        <div className="flex-1 bg-background rounded-md overflow-hidden shadow-2xl flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-white px-4">
              <Loader2 className="w-8 sm:w-12 h-8 sm:h-12 animate-spin" />
              <p className="text-base sm:text-lg">Loading game...</p>
            </div>
          ) : error ? (
            <div className="text-center text-white px-4">
              <p className="text-lg sm:text-xl font-semibold mb-2">Oops!</p>
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          ) : blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={game.title}
              sandbox="allow-scripts allow-forms allow-pointer-lock"
              referrerPolicy="no-referrer"
              data-testid="iframe-game"
            />
          ) : null}
        </div>

        <p className="text-center text-white/60 text-xs sm:text-sm mt-2 sm:mt-4 px-2" data-testid="text-close-instruction">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  );
}
