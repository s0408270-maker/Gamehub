import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, Users, ChevronDown, LogOut, Trophy, Zap, Flame, Wrench, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import Leaderboard from "@/pages/leaderboard";
import CosmeticsShop from "@/pages/cosmetics-shop";
import CosmeticsInventory from "@/pages/cosmetics-inventory";
import PremiumGamesShop from "@/pages/premium-games-shop";
import BattlePass from "@/pages/battle-pass";
import AdminPanel from "@/pages/admin";
import OwnerPanel from "@/pages/owner";
import NotFound from "@/pages/not-found";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnnouncementBanner } from "@/components/announcement-banner";
import type { Group, User } from "@shared/schema";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/groups" component={Groups} />
      <Route path="/groups/:groupId" component={GroupDetail} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/battle-pass" component={BattlePass} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/owner" component={OwnerPanel} />
      <Route path="/shop" component={CosmeticsShop} />
      <Route path="/inventory" component={CosmeticsInventory} />
      <Route path="/premium-games" component={PremiumGamesShop} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Header() {
  const [location, setLocation] = useLocation();
  const username = localStorage.getItem("username") || "";

  const { data: userGroups = [] } = useQuery<Group[]>({
    queryKey: [`/api/users/${username}/groups`],
    enabled: !!username,
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: [`/api/users/${username}`],
    enabled: !!username,
  });

  const currentTab = location === "/" ? "games" : location === "/leaderboard" ? "leaderboard" : location === "/battle-pass" ? "battle-pass" : location === "/shop" ? "shop" : location === "/inventory" ? "inventory" : location === "/premium-games" ? "premium-games" : location === "/admin" ? "admin" : location === "/owner" ? "owner" : location.startsWith("/groups") ? "groups" : "games";
  const isInGroup = location.startsWith("/groups/") && location !== "/groups";

  const handleLogout = () => {
    localStorage.clear();
    queryClient.clear();
    setLocation("/auth");
  };

  return (
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
          
          {username && currentUser && (
            <div className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-md">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-xs sm:text-sm font-semibold text-primary" data-testid="text-coin-display">
                {currentUser.coins || 0}
              </span>
            </div>
          )}
          
          {username && (
            <div className="text-xs sm:text-sm text-muted-foreground px-2 py-1 bg-secondary rounded-md">
              {username}
            </div>
          )}

          {username && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
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
            else if (tab === "leaderboard") setLocation("/leaderboard");
            else if (tab === "battle-pass") setLocation("/battle-pass");
            else if (tab === "shop") setLocation("/shop");
            else if (tab === "inventory") setLocation("/inventory");
            else if (tab === "premium-games") setLocation("/premium-games");
            else if (tab === "admin") setLocation("/admin");
            else if (tab === "owner") setLocation("/owner");
          }} className="w-full">
            <TabsList className="w-full justify-start h-auto bg-transparent p-0 rounded-none border-b border-border/50 overflow-x-auto">
              <TabsTrigger value="games" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-games">
                <Gamepad2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-groups">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Servers</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-leaderboard">
                <Trophy className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Leaderboard</span>
              </TabsTrigger>
              <TabsTrigger value="battle-pass" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-battle-pass">
                <Flame className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Battle Pass</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-shop">
                <Zap className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Shop</span>
              </TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-inventory">
                <Package className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Inventory</span>
              </TabsTrigger>
              <TabsTrigger value="premium-games" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-premium-games">
                <Gamepad2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Premium</span>
              </TabsTrigger>
              {(currentUser?.isAdmin === "true" || currentUser?.role === "admin") && (
                <TabsTrigger value="admin" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-admin">
                  <Wrench className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
              {currentUser?.role === "owner" && (
                <TabsTrigger value="owner" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary" data-testid="tab-owner">
                  <Wrench className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Owner</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}

function AppContent() {
  const username = localStorage.getItem("username");
  const [, setLocation] = useLocation();
  const { data: activeTheme } = useQuery<{ cssOverrides: string } | null>({
    queryKey: ["/api/admin/themes/active"],
    enabled: !!username,
    refetchInterval: 5000,
  });

  const { data: userCosmeticsData } = useQuery({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
    refetchInterval: 5000,
  });

  const { data: allCosmetics = [] } = useQuery({
    queryKey: ["/api/cosmetics"],
    enabled: !!username,
  });

  useEffect(() => {
    if (!username) {
      setLocation("/auth");
    }
  }, [username, setLocation]);

  useEffect(() => {
    if (activeTheme?.cssOverrides) {
      let styleElement = document.getElementById("theme-overrides");
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "theme-overrides";
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = `:root { ${activeTheme.cssOverrides} }`;
    }
  }, [activeTheme]);

  // Apply user's equipped cosmetic
  useEffect(() => {
    const activeId = (userCosmeticsData as any)?.active?.activeCosmeticId;
    if (activeId && allCosmetics.length > 0) {
      const activeCosmetic = allCosmetics.find(c => c.id === activeId);
      if (activeCosmetic && activeCosmetic.type === "theme" && activeCosmetic.value) {
        let styleElement = document.getElementById("cosmetic-overrides");
        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = "cosmetic-overrides";
          document.head.appendChild(styleElement);
        }
        // Parse theme value and apply as CSS variables
        styleElement.textContent = `:root { --cosmetic-theme: '${activeCosmetic.value}'; } body { --active-cosmetic: '${activeCosmetic.value}'; }`;
      }
    } else {
      // Remove cosmetic overrides if no active cosmetic
      const element = document.getElementById("cosmetic-overrides");
      if (element) element.remove();
    }
  }, [userCosmeticsData, allCosmetics]);

  if (!username) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnnouncementBanner />
      <Header />
      <main className="flex-1 overflow-auto">
        <div className="w-full h-full">
          <Router />
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
