import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Users as UsersIcon, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@shared/schema";

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allUsers = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const filteredUsers = allUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold mb-8" data-testid="heading-users">
            Find Players
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-users">
              Find Players
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredUsers.length} player{filteredUsers.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <UsersIcon className="w-10 h-10 text-primary opacity-50" />
        </div>

        {/* Search Input */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search players by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>

        {/* Users Grid */}
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-2">No players found</p>
              <p className="text-muted-foreground text-center">
                Try searching with a different username
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className="overflow-hidden hover-elevate cursor-pointer"
                onClick={() => setLocation(`/profile/${user.username}`)}
                data-testid={`card-user-${user.id}`}
              >
                <CardHeader>
                  <CardTitle className="text-xl">{user.username}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{user.coins || 0} coins</span>
                  </div>
                  {user.isBanned === "true" && (
                    <span className="inline-block px-2 py-1 bg-destructive text-destructive-foreground rounded text-xs font-medium">
                      Banned
                    </span>
                  )}
                  <Button
                    className="w-full mt-2"
                    onClick={() => setLocation(`/profile/${user.username}`)}
                    data-testid={`button-view-profile-${user.id}`}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
