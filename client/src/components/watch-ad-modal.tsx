import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface WatchAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdComplete: () => void;
  isLoading: boolean;
}

export function WatchAdModal({ open, onOpenChange, onAdComplete, isLoading }: WatchAdModalProps) {
  const [adTime, setAdTime] = useState(0);
  const [watching, setWatching] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAdUnitId, setHasAdUnitId] = useState(false);
  const { toast } = useToast();
  const AD_DURATION = 5;

  useEffect(() => {
    if (!open) {
      setAdTime(0);
      setWatching(false);
      setCompleted(false);
      setError(null);
      return;
    }

    // Check if ad unit ID is configured
    const checkAdConfig = async () => {
      try {
        const response = await fetch("/api/owner/ad-config");
        const config = await response.json();
        setHasAdUnitId(!!config?.rewardedAdUnitId);
      } catch (err) {
        console.log("Ad config check failed");
      }
    };

    checkAdConfig();
  }, [open]);

  // Simulate ad countdown
  useEffect(() => {
    if (!watching || completed) return;

    const interval = setInterval(() => {
      setAdTime((prev) => {
        if (prev >= AD_DURATION) {
          clearInterval(interval);
          setCompleted(true);
          return AD_DURATION;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [watching, completed]);

  const handleWatchAd = async () => {
    setWatching(true);
    setError(null);
    setAdTime(0);
    setCompleted(false);

    try {
      const response = await fetch("/api/owner/ad-config");
      const config = await response.json();

      if (config?.rewardedAdUnitId) {
        // Real ad unit is configured - try to load Google Ad
        loadGoogleAd(config.rewardedAdUnitId);
      } else {
        // No real ad configured, just simulate watching
        // Real ad will load automatically once owner saves the Ad Unit ID
      }
    } catch (err) {
      console.error("Failed to check ad config:", err);
      setError("Ad system not available. Try again later.");
      setWatching(false);
    }
  };

  const loadGoogleAd = (adUnitId: string) => {
    // Load Google Ad Manager library
    if (!(window as any).googletag) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
      script.onload = () => {
        setupGoogleAd(adUnitId);
      };
      script.onerror = () => {
        console.log("Google Ad Manager failed to load, using mock ad");
      };
      document.head.appendChild(script);
    } else {
      setupGoogleAd(adUnitId);
    }
  };

  const setupGoogleAd = (adUnitId: string) => {
    const googletag = (window as any).googletag;

    googletag.cmd.push(() => {
      try {
        const slot = googletag.defineOutOfPageSlot(
          adUnitId,
          googletag.enums.OutOfPageFormat.REWARDED
        );

        if (slot) {
          googletag.pubads().enableSingleRequest();
          googletag.enableServices();
          googletag.display(slot);

          // Handle reward
          const rewardedAd = googletag.pubads().getOutOfPageAdSlot(0);
          if (rewardedAd) {
            googletag.pubads().setOnAdLoadedCallback(() => {
              console.log("Real ad loaded");
            });
          }
        }
      } catch (err) {
        console.log("Real ad setup failed, using mock ad instead");
      }
    });
  };

  const handleClaimTier = () => {
    onAdComplete();
    setWatching(false);
    setCompleted(false);
    setAdTime(0);
    onOpenChange(false);
  };

  const progress = (adTime / AD_DURATION) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-watch-ad">
        <DialogHeader>
          <DialogTitle>Watch Advertisement to Unlock Tier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <>
              <div className="bg-destructive/10 rounded-lg p-6 flex items-center justify-center min-h-48">
                <p className="text-center text-sm text-destructive">{error}</p>
              </div>
              <Button
                onClick={() => {
                  setWatching(false);
                  setError(null);
                }}
                className="w-full"
                data-testid="button-close-ad-error"
              >
                Close
              </Button>
            </>
          ) : !watching ? (
            <>
              <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-48">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Ready to watch?</p>
                  <p className="text-sm text-muted-foreground">
                    {hasAdUnitId
                      ? "Click below to watch a real ad"
                      : "Click below to get started"}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleWatchAd}
                disabled={isLoading}
                className="w-full"
                data-testid="button-watch-ad"
              >
                {isLoading ? "Processing..." : "Watch Ad Now"}
              </Button>
            </>
          ) : !completed ? (
            <>
              <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-48">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Advertisement</p>
                  <p className="text-2xl font-bold">{Math.ceil(AD_DURATION - adTime)}s</p>
                  {hasAdUnitId && (
                    <p className="text-xs text-green-600 mt-2">Real ad playing</p>
                  )}
                </div>
              </div>
              <Progress value={progress} className="h-2" data-testid="progress-ad" />
              <p className="text-sm text-muted-foreground text-center">
                Watch the advertisement to unlock a tier
              </p>
            </>
          ) : (
            <>
              <div className="bg-green-500/10 rounded-lg p-8 flex items-center justify-center min-h-48">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Ad Complete!</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Click below to unlock your tier
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClaimTier}
                disabled={isLoading}
                className="w-full"
                data-testid="button-claim-tier"
              >
                {isLoading ? "Unlocking..." : "Claim Tier"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
