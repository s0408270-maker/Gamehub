import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import NotFound from "@/pages/not-found";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Group } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:groupId" component={GroupDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const [username, setUsername] = useState<string>(() => 
    localStorage.getItem("username") || ""
  );

  const { data: userGroups = [] } = useQuery<Group[]>({
    queryKey: [`/api/users/${username}/groups`],
    enabled: !!username,
  });

  const currentTab = location === "/" ? "games" : location.startsWith("/groups") ? "groups" : "chat";
  const isInGroup = location.startsWith("/groups/") && location !== "/groups";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Gamepad2 className="w-6 sm:w-8 h-6 sm:h-8 text-primary flex-shrink-0" data-testid="icon-logo" />
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate" data-testid="text-site-name">
                  GameHub
                </h1>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {isInGroup && username && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" data-testid="button-groups-dropdown">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Servers</span>
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-testid="dropdown-groups-list">
                      <DropdownMenuLabel>Your Servers</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {userGroups.length > 0 ? (
                        userGroups.map((group) => (
                          <DropdownMenuItem
                            key={group.id}
                            onClick={() => setLocation(`/groups/${group.id}`)}
                            data-testid={`dropdown-item-group-${group.id}`}
                          >
                            {group.name}
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <DropdownMenuItem disabled>No servers yet</DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/groups")} data-testid="dropdown-item-all-groups">
                        Browse All Servers
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                {username && (
                  <div className="text-xs sm:text-sm text-muted-foreground px-2 py-1 bg-secondary rounded-md">
                    {username}
                  </div>
                )}
                <ThemeToggle />
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t border-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <Tabs value={currentTab} onValueChange={(tab) => {
                  if (tab === "games") setLocation("/");
                  else if (tab === "groups") setLocation("/groups");
                }} className="w-full">
                  <TabsList className="w-full justify-start h-auto bg-transparent p-0 rounded-none border-b border-border/50">
                    <TabsTrigger value="games" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-games">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Games</span>
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-groups">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Servers</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="w-full h-full">
              <Router />
            </div>
          </main>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
