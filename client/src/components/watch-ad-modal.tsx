import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface WatchAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdComplete: () => void;
  isLoading: boolean;
}

export function WatchAdModal({ open, onOpenChange, onAdComplete, isLoading }: WatchAdModalProps) {
  const [adTime, setAdTime] = useState(0);
  const AD_DURATION = 5; // 5 second fake ad

  useEffect(() => {
    if (!open) {
      setAdTime(0);
      return;
    }

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
    if (adTime >= AD_DURATION) {
      const timer = setTimeout(() => {
        onAdComplete();
        onOpenChange(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [adTime, onAdComplete, onOpenChange]);

  const progress = (adTime / AD_DURATION) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Watch Advertisement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-48">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Advertisement</p>
              <p className="text-2xl font-bold">{Math.ceil(AD_DURATION - adTime)}s</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-ad" />
          <p className="text-sm text-muted-foreground text-center">
            {adTime >= AD_DURATION ? "Ad complete! Unlocking tier..." : "Watch the advertisement to unlock a tier"}
          </p>
          {adTime < AD_DURATION && (
            <Button disabled variant="outline" className="w-full" data-testid="button-skip-ad">
              Skip (not available)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
