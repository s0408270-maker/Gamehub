# Design Guidelines: Game Portal Website

## Design Approach
**Reference-Based: Gaming Portal Aesthetic**
Drawing inspiration from Steam, itch.io, and modern gaming platforms. Focus on creating an immersive, high-energy experience that celebrates gaming culture with bold visuals and clear hierarchy.

## Design Principles
- **Gaming-First Aesthetic**: Dark, high-contrast interface with vibrant accent colors and dynamic elements
- **Content Showcase**: Game thumbnails are the hero - large, prominent, with hover effects
- **Instant Clarity**: Users should immediately understand this is a game portal and how to play

## Typography
- **Headings**: Bold, modern sans-serif (e.g., 'Inter' or 'Poppins' at 700-900 weight)
  - H1: text-4xl to text-6xl - punchy, commanding presence
  - H2: text-3xl to text-4xl - section headers
  - H3: text-xl to text-2xl - game titles
- **Body**: Clean sans-serif (same family, 400-500 weight)
  - Base: text-base - game descriptions
  - Small: text-sm - metadata, tags

## Layout System
**Spacing Units**: Tailwind units of 4, 6, 8, 12, 16, 20
- Consistent padding: p-6 to p-8 for cards, p-16 to p-20 for sections
- Grid gaps: gap-6 for game grids, gap-4 for smaller elements

## Component Library

### Hero Section
- **Full-width banner** (h-96 to h-[500px]) with gradient overlay
- Large heading: "Your Game Collection" or "Play Free Games"
- Upload button (primary CTA) with blurred background overlay positioned prominently
- Subheading explaining the portal functionality
- Hero image: Dark gaming-themed illustration or abstract gaming graphics (controllers, pixel art elements, neon aesthetics)

### Game Grid
- **Responsive Grid**: grid-cols-2 md:grid-cols-3 lg:grid-cols-4
- Each game card includes:
  - Thumbnail image (aspect-ratio-video, 16:9)
  - Game title overlay or below thumbnail
  - Hover effect: scale-105 transform with shadow increase
  - Play button appears on hover (blurred background)

### Upload Section
- **Prominent card** (max-w-2xl, centered) with dashed border for drag-and-drop
- Icon representation of file upload
- Clear instructions: "Upload HTML Game Files"
- File input styled as gaming-themed button
- Preview thumbnails of uploaded games before publishing

### Game Player Modal
- **Full-screen overlay** (fixed inset-0, z-50)
- Dark backdrop (bg-black/90)
- Iframe container: centered, max-w-7xl, aspect-ratio preserved
- Close button: top-right, highly visible with blurred circle background
- Game title displayed above iframe

### Navigation
- **Sticky header** with site logo/name
- Simple nav: Home, Browse Games, Upload
- Accent-colored active states
- Mobile: hamburger menu

### Footer
- Minimal, dark background
- Links: About, Contact, Terms
- Social icons if applicable

## Animations
- **Hover transitions**: transform and shadow changes (duration-300)
- **Modal enter/exit**: fade-in overlay, scale-in content
- **No complex scroll animations** - keep focus on game content

## Images
**Hero Image**: Abstract gaming aesthetic - neon grid patterns, pixelated graphics, controller silhouettes, or vibrant gradient gaming scene. Should evoke energy and playfulness.

**Game Thumbnails**: Each game displays a representative screenshot or custom thumbnail (16:9 ratio, optimized for web)

---

**Key Visual Direction**: Create a dark, immersive environment where game thumbnails pop with vibrant energy. Think Steam's modern UI meets itch.io's creative freedom - polished but playful, organized but exciting.