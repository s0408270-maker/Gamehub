import { X, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameOptionsMenu } from "./game-options-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const [gameUrl, setGameUrl] = useState<string>(`/api/play/${game.id}`);
  const [difficulty, setDifficulty] = useState<string>("");
  const [avgDifficulty, setAvgDifficulty] = useState<number>(0);
  const gameType = (game as any).gameType || "html";
  const username = localStorage.getItem("username") || "";
  const { toast } = useToast();

  // Fetch average difficulty
  useEffect(() => {
    if (!open) return;
    const fetchDifficulty = async () => {
      try {
        const res = await fetch(`/api/games/${game.id}/difficulty`);
        if (res.ok) {
          const data = await res.json();
          setAvgDifficulty(data.difficulty || 0);
        }
      } catch (err) {
        console.error("Failed to fetch difficulty:", err);
      }
    };
    fetchDifficulty();
  }, [open, game.id]);

  // Submit difficulty rating
  const handleDifficultySubmit = async () => {
    if (!difficulty || !username) return;
    try {
      await apiRequest("POST", `/api/games/${game.id}/rate-difficulty`, {
        username,
        difficulty: parseInt(difficulty),
      });
      toast({ title: "Success", description: "Difficulty rating submitted!" });
      setDifficulty("");
      const res = await fetch(`/api/games/${game.id}/difficulty`);
      if (res.ok) {
        const data = await res.json();
        setAvgDifficulty(data.difficulty || 0);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to submit rating" });
    }
  };

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

  // Check if game HTML contains an external iframe and load it directly
  useEffect(() => {
    if (!open || gameType !== "html") {
      setLoading(false);
      return;
    }

    const detectExternalContent = async () => {
      try {
        const response = await fetch(`/api/play/${game.id}`);
        const html = await response.text();
        
        // Parse HTML to find external content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Check for iframes first (primary case - Truffled wrapper)
        const iframes = Array.from(doc.querySelectorAll("iframe"));
        for (const iframe of iframes) {
          const src = iframe.getAttribute("src");
          if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
            // Found external iframe (like Truffled games)
            setGameUrl(src);
            setLoading(false);
            return;
          }
        }
        
        // Check for embed tags (SWF files)
        const embeds = Array.from(doc.querySelectorAll("embed"));
        for (const embed of embeds) {
          const src = embed.getAttribute("src");
          if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
            setGameUrl(src);
            setLoading(false);
            return;
          }
        }
        
        // Check for script tags that might load external content
        const scripts = Array.from(doc.querySelectorAll("script"));
        for (const script of scripts) {
          const src = script.getAttribute("src");
          if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
            // If script loads external content, still load wrapper
            break;
          }
        }
        
        // No external content found, load as normal
        setLoading(false);
      } catch (err) {
        console.error("Error detecting game content:", err);
        setLoading(false);
      }
    };

    detectExternalContent();
  }, [open, game.id, gameType]);

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
        <div className="flex items-center justify-between mb-2 sm:mb-4 px-2 sm:px-4 gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate" data-testid="text-playing-game-title">
              {game.title}
            </h2>
            {avgDifficulty > 0 && <p className="text-xs text-white/60">Avg difficulty: {avgDifficulty}/5</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-20 h-9 text-white bg-white/10 border-white/20" data-testid="select-difficulty">
                  <SelectValue placeholder="Rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Easy</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5 - Hard</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 h-9 w-9"
                onClick={handleDifficultySubmit}
                disabled={!difficulty}
                data-testid="button-submit-difficulty"
              >
                <Star className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={onClose}
              data-testid="button-close-player"
            >
              <X className="w-5 sm:w-6 h-5 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Game Container */}
        <div className="flex-1 bg-background rounded-md overflow-hidden shadow-2xl flex items-center justify-center relative">
          <GameOptionsMenu game={game} createdBy={game.createdBy} />
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
              src={gameUrl}
              className="w-full h-full border-0"
              title={game.title}
              referrerPolicy="no-referrer"
              allowFullScreen
              allow="autoplay; microphone; camera; encrypted-media; accelerometer; gyroscope; payment; usb; vr"
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
