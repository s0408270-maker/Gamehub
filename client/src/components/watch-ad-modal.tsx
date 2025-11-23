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
  const [adLoaded, setAdLoaded] = useState(false);
  const [adWatched, setAdWatched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setAdLoaded(false);
      setAdWatched(false);
      setError(null);
      return;
    }

    // Fetch the ad config to get the rewarded ad unit ID
    const loadAd = async () => {
      try {
        const response = await fetch("/api/owner/ad-config");
        const config = await response.json();

        if (!config.rewardedAdUnitId) {
          setError("Rewarded ads are not configured yet. Please contact the owner.");
          return;
        }

        // Load Google Ad Manager script if not already loaded
        if (!(window as any).googletag) {
          const script = document.createElement("script");
          script.async = true;
          script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
          script.onload = () => {
            // Initialize GPT
            const googletag = (window as any).googletag;
            googletag.cmd.push(() => {
              googletag.defineOutOfPageSlot(config.rewardedAdUnitId, googletag.enums.OutOfPageFormat.REWARDED).setTargeting("is_rewarded_video_ad", true);
            });
            setAdLoaded(true);
          };
          script.onerror = () => {
            setError("Failed to load ad system. Please try again.");
          };
          document.head.appendChild(script);
        } else {
          setAdLoaded(true);
        }
      } catch (err) {
        setError("Failed to load ad configuration");
        console.error("Ad load error:", err);
      }
    };

    loadAd();
  }, [open]);

  const handleCloseDialog = () => {
    if (adWatched) {
      onAdComplete();
    }
    onOpenChange(false);
  };

  const handleWatchAd = async () => {
    try {
      const response = await fetch("/api/owner/ad-config");
      const config = await response.json();

      if (!config.rewardedAdUnitId) {
        setError("Rewarded ads are not configured yet.");
        return;
      }

      const googletag = (window as any).googletag;

      if (!googletag) {
        setError("Ad system not ready. Please try again.");
        return;
      }

      googletag.cmd.push(() => {
        const rewardedAd = googletag.pubads().getOutOfPageAdSlot(0);

        if (rewardedAd) {
          // Set up reward callback
          rewardedAd.setConfig({
            onAdComplete: () => {
              setAdWatched(true);
              toast({
                title: "Success!",
                description: "You've unlocked a tier! Claim your reward.",
              });
            },
            onAdError: () => {
              setError("There was an error loading the ad. Please try again.");
            },
          });

          // Display the ad
          googletag.pubads().display(rewardedAd);
        } else {
          setError("Failed to initialize rewarded ad slot.");
        }
      });
    } catch (err) {
      setError("Failed to load ad. Please try again.");
      console.error("Watch ad error:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Watch Advertisement to Unlock Tier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error ? (
            <>
              <div className="bg-destructive/10 rounded-lg p-6 flex items-center justify-center min-h-48">
                <p className="text-center text-destructive">{error}</p>
              </div>
              <Button onClick={() => onOpenChange(false)} className="w-full" data-testid="button-close-ad-error">
                Close
              </Button>
            </>
          ) : adWatched ? (
            <>
              <div className="bg-success/10 rounded-lg p-8 flex items-center justify-center min-h-48">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-2">Ad Complete!</p>
                  <p className="text-muted-foreground">Tier unlocked. Claim your reward below.</p>
                </div>
              </div>
              <Button onClick={handleCloseDialog} className="w-full" disabled={isLoading} data-testid="button-claim-reward">
                {isLoading ? "Unlocking..." : "Claim Tier"}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-48">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">Advertisement Area</p>
                  <p className="text-sm">Google AdSense Ad will appear here</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Watch the full advertisement to unlock a tier and earn rewards!
              </p>
              <Button
                onClick={handleWatchAd}
                disabled={!adLoaded || isLoading}
                className="w-full"
                data-testid="button-watch-ad"
              >
                {isLoading ? "Processing..." : adLoaded ? "Watch Ad Now" : "Loading Ad..."}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
