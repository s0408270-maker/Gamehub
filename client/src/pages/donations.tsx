import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function Donations() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Support GameHub</h1>
          <p className="text-lg text-white/80">
            Love GameHub? Help keep this platform running and growing! Your support means everything.
          </p>
        </div>

        {/* Donation Options */}
        <div className="grid gap-6 mb-12">
          {/* CashApp Card */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">CashApp</h2>
                <p className="text-white/70">Quick and easy donations</p>
              </div>
            </div>
            <p className="text-white/60 mb-6">
              Support us directly via CashApp. Every donation helps us maintain and improve GameHub for the community.
            </p>
            <a
              href="https://cash.app/$YOURCASHTAG"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Donate via CashApp
              </Button>
            </a>
            <p className="text-xs text-white/50 mt-3">
              Replace $YOURCASHTAG with your actual CashApp tag
            </p>
          </div>
        </div>

        {/* Why Support */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-white mb-6">What Your Support Goes To</h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white">Server & Hosting</p>
                <p className="text-sm text-white/60">Keep GameHub online and running smoothly</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white">New Features</p>
                <p className="text-sm text-white/60">Develop new games, cosmetics, and improvements</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-pink-400 text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="font-semibold text-white">Community Growth</p>
                <p className="text-sm text-white/60">Support creators and build the gaming community</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Thank You */}
        <div className="text-center mt-12">
          <p className="text-white/70 text-lg">
            Even if you can't donate, we appreciate your support by playing games and sharing GameHub with others! 🎮
          </p>
        </div>
      </div>
    </div>
  );
}
