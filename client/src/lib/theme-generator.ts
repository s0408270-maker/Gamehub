export function generateThemeFromDescription(description: string): string {
  const desc = description.toLowerCase();
  
  // Detect theme characteristics
  const isDark = desc.includes("dark") || desc.includes("black") || desc.includes("night");
  const isLight = desc.includes("light") || desc.includes("white") || desc.includes("bright");
  const hasNeon = desc.includes("neon") || desc.includes("vibrant") || desc.includes("bright") || desc.includes("electric");
  
  // Detect primary color from keywords
  let primaryHue = 200; // default blue
  if (desc.includes("red") || desc.includes("crimson") || desc.includes("ruby")) primaryHue = 0;
  else if (desc.includes("orange") || desc.includes("amber")) primaryHue = 30;
  else if (desc.includes("yellow") || desc.includes("gold")) primaryHue = 50;
  else if (desc.includes("green") || desc.includes("forest") || desc.includes("lime")) primaryHue = 120;
  else if (desc.includes("cyan") || desc.includes("turquoise") || desc.includes("aqua")) primaryHue = 180;
  else if (desc.includes("blue") || desc.includes("ocean") || desc.includes("navy")) primaryHue = 200;
  else if (desc.includes("purple") || desc.includes("violet") || desc.includes("indigo")) primaryHue = 270;
  else if (desc.includes("pink") || desc.includes("magenta")) primaryHue = 320;
  
  // Detect secondary color (complementary or different)
  let secondaryHue = (primaryHue + 120) % 360;
  if (desc.includes("and") && desc.match(/and\s+(\w+)/)) {
    const colorMatch = desc.match(/and\s+(red|orange|yellow|green|cyan|blue|purple|pink)/);
    if (colorMatch) {
      const colors: Record<string, number> = {
        red: 0, orange: 30, yellow: 50, green: 120, cyan: 180, blue: 200, purple: 270, pink: 320,
      };
      secondaryHue = colors[colorMatch[1]] || secondaryHue;
    }
  }
  
  // Detect accent color
  let accentHue = (primaryHue + 60) % 360;
  
  // Saturation
  const saturation = hasNeon ? 100 : 80;
  
  // Lightness for background and text
  const bgLightness = isDark ? 15 : isLight ? 95 : 20;
  const cardLightness = isDark ? 25 : isLight ? 90 : 30;
  const fgLightness = isDark ? 95 : isLight ? 10 : 90;
  const accentSaturation = hasNeon ? 100 : 90;
  const accentLightness = isDark ? 55 : 45;
  
  return `--primary: ${primaryHue} ${saturation}% 50%;
--primary-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--secondary: ${secondaryHue} ${saturation}% 50%;
--secondary-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--accent: ${accentHue} ${accentSaturation}% ${accentLightness}%;
--accent-foreground: ${isDark ? 0 : 200} ${isDark ? 0 : 30}% ${isDark ? 100 : 15}%;
--background: ${primaryHue} 30% ${bgLightness}%;
--foreground: ${primaryHue} 30% ${fgLightness}%;
--card: ${primaryHue} 30% ${cardLightness}%;
--border: ${primaryHue} ${saturation}% 50%;`;
}
