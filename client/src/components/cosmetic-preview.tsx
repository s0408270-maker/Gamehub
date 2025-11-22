import type { Cosmetic } from "@shared/schema";

export function CosmeticPreview({ cosmetic }: { cosmetic: Cosmetic }) {
  if (cosmetic.type === 'theme') {
    const themes: Record<string, JSX.Element> = {
      'cyberpunk': (
        <div className="w-full h-48 bg-black overflow-hidden">
          <div className="grid grid-cols-2 h-full gap-px bg-cyan-500">
            <div className="bg-purple-900 flex items-center justify-center"><div className="text-cyan-400 font-bold text-xl">▌</div></div>
            <div className="bg-black flex items-center justify-center"><div className="text-pink-500 text-xl">◆</div></div>
            <div className="bg-black flex items-center justify-center"><div className="text-cyan-400 text-xl">◆</div></div>
            <div className="bg-purple-900 flex items-center justify-center"><div className="text-pink-500 font-bold">▌</div></div>
          </div>
        </div>
      ),
      'dark_pro': (
        <div className="w-full h-48 bg-neutral-900 flex flex-col">
          <div className="h-1/3 bg-neutral-800 border-b border-neutral-700 flex items-center px-4">
            <div className="text-neutral-400 text-sm">Header</div>
          </div>
          <div className="h-2/3 bg-neutral-900 p-4 space-y-3">
            <div className="h-6 bg-neutral-800 rounded"></div>
            <div className="h-6 bg-neutral-800 rounded w-2/3"></div>
            <div className="h-6 bg-neutral-800 rounded w-1/2"></div>
          </div>
        </div>
      ),
      'forest': (
        <div className="w-full h-48 bg-green-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="text-6xl">🌲🌲🌲</div>
          </div>
          <div className="text-green-300 text-2xl font-bold z-10">Forest</div>
        </div>
      ),
    };
    return themes[cosmetic.value] || themes['dark_pro'];
  } else if (cosmetic.type === 'badge') {
    const badges: Record<string, JSX.Element> = {
      'pro_player': (
        <div className="w-full h-48 bg-gradient-to-br from-yellow-900 to-red-900 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl">⭐</div>
            <div className="text-yellow-200 font-bold text-lg">PRO</div>
          </div>
        </div>
      ),
    };
    return badges[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
  } else if (cosmetic.type === 'profile_frame') {
    const frames: Record<string, JSX.Element> = {
      'gold_frame': (
        <div className="w-full h-48 bg-secondary rounded-lg border-4 border-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 relative">
          <div className="absolute inset-2 border-2 border-yellow-400 rounded-sm"></div>
          <div className="text-yellow-400 font-bold z-10">Gold Frame</div>
        </div>
      ),
    };
    return frames[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
  } else if (cosmetic.type === 'cursor') {
    const cursors: Record<string, JSX.Element> = {
      'sword': (
        <div className="w-full h-48 bg-amber-900/30 rounded-lg flex items-center justify-center relative cursor-pointer hover:bg-amber-800/40">
          <div className="text-center">
            <div className="text-6xl mb-2">⚔️</div>
            <div className="text-amber-700 font-bold">Sword Cursor</div>
          </div>
        </div>
      ),
    };
    return cursors[cosmetic.value] || <div className="w-full h-48 bg-secondary rounded-lg"></div>;
  }

  return <div className="w-full h-48 bg-secondary rounded-lg"></div>;
}
