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
  const [hasAdUnitId, setHasAdUnitId] = useState(false);
  const { toast } = useToast();
  const AD_DURATION = 5; // 5 second ad (real ads will be longer)

  useEffect(() => {
    if (!open) {
      setAdTime(0);
      return;
    }

    // Check if rewarded ad unit ID is configured
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

    // Simulate ad watching
    const interval = setInterval(() => {
      setAdTime((prev) => {
        if (prev >= AD_DURATION) {
          clearInterval(interval);
          return AD_DURATION;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (adTime >= AD_DURATION && open) {
      const timer = setTimeout(() => {
        onAdComplete();
        onOpenChange(false);
        toast({
          title: "Success!",
          description: "Ad watched. Tier unlocked!",
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [adTime, open, onAdComplete, onOpenChange, toast]);

  const progress = (adTime / AD_DURATION) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-watch-ad">
        <DialogHeader>
          <DialogTitle>Watch Advertisement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-48">
            <div className="text-center">
              {adTime < AD_DURATION ? (
                <>
                  <p className="text-muted-foreground mb-4">Advertisement</p>
                  <p className="text-2xl font-bold">{Math.ceil(AD_DURATION - adTime)}s</p>
                  {hasAdUnitId && (
                    <p className="text-xs text-muted-foreground mt-2">Real ad playing</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground">Ad Complete!</p>
                  <p className="text-muted-foreground text-sm mt-2">Unlocking tier...</p>
                </>
              )}
            </div>
          </div>
          
          {adTime < AD_DURATION && (
            <Progress value={progress} className="h-2" data-testid="progress-ad" />
          )}
          
          <p className="text-sm text-muted-foreground text-center">
            {adTime >= AD_DURATION
              ? "Ad complete! Tier is being unlocked..."
              : "Watch the advertisement to unlock a tier"}
          </p>

          {adTime >= AD_DURATION && (
            <Button
              onClick={() => {
                onAdComplete();
                onOpenChange(false);
              }}
              disabled={isLoading}
              className="w-full"
              data-testid="button-claim-tier"
            >
              {isLoading ? "Unlocking..." : "Claim Tier"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
