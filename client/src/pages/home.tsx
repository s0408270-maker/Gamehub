import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Upload, Play, Gamepad2, Github, Twitter, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadGameForm } from "@/components/upload-game-form";
import { GamePlayerModal } from "@/components/game-player-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Game } from "@shared/schema";
import heroImage from "@assets/generated_images/gaming_portal_hero_background.png";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const username = localStorage.getItem("username") || "";

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      return await apiRequest("DELETE", `/api/games/${gameId}`, { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({ title: "Success", description: "Game deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete game" });
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Gamepad2 className="w-6 sm:w-8 h-6 sm:h-8 text-primary flex-shrink-0" data-testid="icon-logo" />
            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate" data-testid="text-site-name">
              GameHub
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="sm:size-auto" data-testid="button-upload-nav">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">Upload New Game</DialogTitle>
                </DialogHeader>
                <UploadGameForm onSuccess={() => setUploadDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-64 sm:h-[500px] flex items-center justify-center overflow-hidden"  data-testid="section-hero">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Gaming portal hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Gamepad2 className="w-8 sm:w-12 h-8 sm:h-12 text-primary flex-shrink-0" data-testid="icon-hero-gamepad" />
            <h2 className="text-2xl sm:text-5xl md:text-6xl font-black text-white tracking-tight line-clamp-2" data-testid="heading-hero-title">
              GameHub
            </h2>
          </div>
          <p className="text-base sm:text-xl md:text-2xl text-white/90 mb-4 sm:mb-8 font-medium" data-testid="text-hero-subtitle">
            Your Personal Game Arcade
          </p>
          <p className="text-sm sm:text-lg text-white/75 mb-6 sm:mb-10 max-w-2xl mx-auto" data-testid="text-hero-description">
            Upload and play HTML5 games instantly. Build your collection and enjoy unlimited gaming.
          </p>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="text-sm sm:text-lg px-4 sm:px-8 h-10 sm:h-14 bg-primary hover:bg-primary/90 backdrop-blur-sm shadow-lg shadow-primary/20"
                data-testid="button-upload-hero"
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Upload Game
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-bold">Upload New Game</DialogTitle>
              </DialogHeader>
              <UploadGameForm onSuccess={() => setUploadDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Games Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16 flex-1 w-full">
        <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 flex-col sm:flex-row gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="heading-game-collection">
              Game Collection
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-game-count">
              {games?.length ? `${games.length} game${games.length !== 1 ? 's' : ''} available` : 'Start building your collection'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="h-4 sm:h-6 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {games.map((game) => (
              <Card 
                key={game.id} 
                className="group overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 relative"
                data-testid={`card-game-${game.id}`}
              >
                <div 
                  className="relative aspect-video overflow-hidden bg-muted cursor-pointer"
                  onClick={() => setSelectedGame(game)}
                >
                  <img 
                    src={game.thumbnail} 
                    alt={game.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-75 group-hover:scale-100">
                      <div className="bg-primary/90 backdrop-blur-sm rounded-full p-4">
                        <Play className="w-8 h-8 text-primary-foreground fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold text-card-foreground line-clamp-1 flex-1" data-testid={`text-game-title-${game.id}`}>
                    {game.title}
                  </h3>
                  {(game as any).createdBy && username && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGameMutation.mutate(game.id);
                      }}
                      disabled={deleteGameMutation.isPending}
                      data-testid={`button-delete-game-${game.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3" data-testid="heading-empty-state">No Games Yet</h3>
              <p className="text-muted-foreground mb-6 text-lg" data-testid="text-empty-description">
                Start building your game collection by uploading your first HTML5 game.
              </p>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    data-testid="button-upload-empty"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload First Game
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl sm:text-2xl font-bold">Upload New Game</DialogTitle>
                  </DialogHeader>
                  <UploadGameForm onSuccess={() => setUploadDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        )}
      </section>

      {/* Game Player Modal */}
      {selectedGame && (
        <GamePlayerModal 
          game={selectedGame} 
          open={!!selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <p className="text-muted-foreground" data-testid="text-footer-copyright">
                © 2024 GameHub. Your personal game arcade.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild data-testid="link-github">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="link-twitter">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild data-testid="link-contact">
                <a href="mailto:contact@gamehub.com">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact
                </a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
