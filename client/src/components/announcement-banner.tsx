import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Announcement } from "@shared/schema";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  
  const { data: announcement, refetch } = useQuery<Announcement | null>({
    queryKey: ["/api/announcements/active"],
    refetchInterval: 1000, // Poll every 1 second for new announcements
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (announcement) {
      setDismissed(false);
    }
  }, [announcement?.id]);

  const handleDismiss = async () => {
    if (announcement) {
      await apiRequest("POST", `/api/announcements/${announcement.id}/dismiss`, {});
      setDismissed(true);
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/active"] });
    }
  };

  if (!announcement || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between gap-4 z-50 shadow-lg" data-testid="banner-announcement">
      <div className="flex-1 text-center text-sm sm:text-base font-semibold">
        {announcement.message}
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={handleDismiss}
        className="text-primary-foreground hover:bg-primary/80 flex-shrink-0"
        data-testid="button-dismiss-announcement"
      >
        <X className="w-5 h-5" />
      </Button>
    </div>
  );
}
