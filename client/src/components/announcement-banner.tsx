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
    <div 
      onClick={handleDismiss}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 cursor-pointer text-foreground text-sm sm:text-base font-semibold hover:opacity-70 transition-opacity"
      data-testid="banner-announcement"
    >
      {announcement.message}
    </div>
  );
}
