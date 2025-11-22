import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Game } from "@shared/schema";
import { useEffect, useState } from "react";

// Add Ruffle player script
const RUFFLE_SCRIPT = "https://cdn.jsdelivr.net/npm/ruffle-rs@latest/dist/ruffle.js";

interface GamePlayerModalProps {
  game: Game;
  open: boolean;
  onClose: () => void;
}

export function GamePlayerModal({ game, open, onClose }: GamePlayerModalProps) {
  const [loading, setLoading] = useState(true);
  const gameType = (game as any).gameType || "html";
  const username = localStorage.getItem("username") || "";

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

  // Track coins while playing - award 5 coins per minute
  useEffect(() => {
    if (!open || !username) return;

    const interval = setInterval(async () => {
      try {
        await fetch("/api/coins/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, amount: 5 }),
        });
      } catch (err) {
        console.error("Failed to add coins:", err);
      }
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval);
  }, [open, username]);

  // Load Ruffle for SWF files
  useEffect(() => {
    if (!open || gameType !== "swf") return;

    const script = document.createElement("script");
    script.src = RUFFLE_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }, [open, gameType]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

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

        {/* Game Container */}
        <div className="flex-1 bg-background rounded-md overflow-hidden shadow-2xl flex items-center justify-center relative">
          {loading && (
            <div className="flex flex-col items-center gap-3 sm:gap-4 text-white px-4">
              <Loader2 className="w-8 sm:w-12 h-8 sm:h-12 animate-spin" />
              <p className="text-base sm:text-lg">Loading game...</p>
            </div>
          )}
          {gameType === "swf" ? (
            <embed
              src={`/api/play/${game.id}`}
              type="application/x-shockwave-flash"
              className="w-full h-full"
              title={game.title}
              data-testid="embed-game-swf"
            />
          ) : (
            <iframe
              src={`/api/play/${game.id}`}
              className="w-full h-full border-0"
              title={game.title}
              sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin allow-top-navigation allow-popups allow-presentation"
              referrerPolicy="no-referrer"
              allowFullScreen
              onLoad={handleIframeLoad}
              data-testid="iframe-game"
            />
          )}
        </div>

        <p className="text-center text-white/60 text-xs sm:text-sm mt-2 sm:mt-4 px-2" data-testid="text-close-instruction">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  );
}
