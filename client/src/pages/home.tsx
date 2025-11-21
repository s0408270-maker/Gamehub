import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, Play, Gamepad2, Github, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadGameForm } from "@/components/upload-game-form";
import { GamePlayerModal } from "@/components/game-player-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Game } from "@shared/schema";
import heroImage from "@assets/generated_images/gaming_portal_hero_background.png";

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" data-testid="icon-logo" />
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-site-name">
              GameHub
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" data-testid="button-upload-nav">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Upload New Game</DialogTitle>
                </DialogHeader>
                <UploadGameForm onSuccess={() => setUploadDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden"  data-testid="section-hero">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Gaming portal hero" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gamepad2 className="w-12 h-12 text-primary" data-testid="icon-hero-gamepad" />
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight" data-testid="heading-hero-title">
              GameHub
            </h2>
          </div>
          <p className="text-xl md:text-2xl text-white/90 mb-8 font-medium" data-testid="text-hero-subtitle">
            Your Personal Game Arcade
          </p>
          <p className="text-lg text-white/75 mb-10 max-w-2xl mx-auto" data-testid="text-hero-description">
            Upload and play HTML5 games instantly. Build your collection and enjoy unlimited gaming.
          </p>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="text-lg px-8 h-14 bg-primary hover:bg-primary/90 backdrop-blur-sm shadow-lg shadow-primary/20"
                data-testid="button-upload-hero"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Your Game
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Upload New Game</DialogTitle>
              </DialogHeader>
              <UploadGameForm onSuccess={() => setUploadDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Games Grid Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2" data-testid="heading-game-collection">
              Game Collection
            </h2>
            <p className="text-muted-foreground text-lg" data-testid="text-game-count">
              {games?.length ? `${games.length} game${games.length !== 1 ? 's' : ''} available` : 'Start building your collection'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : games && games.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Card 
                key={game.id} 
                className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300"
                onClick={() => setSelectedGame(game)}
                data-testid={`card-game-${game.id}`}
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
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
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-card-foreground line-clamp-1" data-testid={`text-game-title-${game.id}`}>
                    {game.title}
                  </h3>
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Upload New Game</DialogTitle>
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
