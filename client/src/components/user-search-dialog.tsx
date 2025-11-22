import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

export function UserSearchDialog() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8);

  const handleSelectUser = (username: string) => {
    setOpen(false);
    setSearchQuery("");
    setLocation(`/profile/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          data-testid="button-search-users"
          title="Search for players"
        >
          <Search className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-md" data-testid="dialog-search-users">
        <DialogHeader>
          <DialogTitle>Search Players</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Enter username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
              data-testid="input-search-query"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-md" />
                ))}
              </>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "No players found" : "Start typing to search"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Button
                  key={user.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => handleSelectUser(user.username)}
                  data-testid={`button-user-result-${user.id}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{user.username}</span>
                    {user.isBanned === "true" && (
                      <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                        Banned
                      </span>
                    )}
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
