import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Users, MessageSquare } from "lucide-react";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import NotFound from "@/pages/not-found";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

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

  const handleUsernameChange = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  };

  const currentTab = location === "/" ? "games" : location.startsWith("/groups") ? "groups" : "chat";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-background flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Gamepad2 className="w-6 sm:w-8 h-6 sm:h-8 text-primary flex-shrink-0" data-testid="icon-logo" />
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate" data-testid="text-site-name">
                  GameHub
                </h1>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
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
                      <span className="hidden sm:inline">Groups</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {/* Pass username and setter to pages */}
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
