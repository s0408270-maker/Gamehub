# GameHub - HTML5 Game Portal

## Overview

GameHub is a web-based game portal that allows users to upload, browse, and play HTML5 games directly in their browser. The platform provides a Steam/itch.io-inspired gaming aesthetic with a focus on showcasing game thumbnails prominently and enabling seamless in-browser gameplay. Users can upload HTML game files along with thumbnails, and the games are displayed in a responsive grid layout with hover effects and modal-based gameplay.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool and development server.

**UI Component System**: The application uses shadcn/ui components built on Radix UI primitives, providing a comprehensive set of accessible, customizable components. The design system follows a gaming portal aesthetic with dark themes, high contrast, and vibrant accents inspired by Steam and itch.io.

**Styling Approach**: Tailwind CSS with a custom configuration extending the default theme. Uses CSS variables for theming support (light/dark modes) and Poppins as the primary font family for a modern, bold gaming aesthetic.

**State Management**: React Query (@tanstack/react-query) handles server state management, caching, and data synchronization. Local component state uses React hooks (useState, useEffect) for UI interactions.

**Routing**: wouter provides lightweight client-side routing. Currently implements a simple structure with a home page and 404 fallback.

**Form Handling**: react-hook-form with zod schema validation ensures type-safe form inputs and validation for game uploads.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js. Separate development (index-dev.ts with Vite middleware) and production (index-prod.ts with static file serving) entry points.

**File Upload Processing**: Multer middleware handles multipart/form-data for HTML game files and thumbnail images. Files are stored in the local filesystem under an `uploads` directory with separate subdirectories for games and thumbnails.

**API Design**: RESTful API structure with routes for:
- GET /api/games - Retrieve all games
- POST /api/games - Upload new game (title, HTML file, thumbnail)
- GET /api/play/:id - Serve game HTML content for in-browser play

**Game Playback Security**: Games are loaded in isolation using blob URLs created from fetched HTML content, preventing direct file system access and providing sandboxed execution in iframes.

### Data Storage Solutions

**Current Implementation**: In-memory storage using a Map data structure (MemStorage class) that implements the IStorage interface. Games are stored with generated UUIDs as identifiers.

**Schema Definition**: Drizzle ORM schema defines a PostgreSQL table structure for games with fields: id (UUID), title (text), thumbnail (text path), htmlPath (text path). Schema includes Zod validation for type safety.

**Database Configuration**: Drizzle Kit configured for PostgreSQL with Neon serverless driver. The application is architected to support database persistence but currently runs with in-memory storage. Migration directory structure is in place for future database integration.

**Rationale**: The in-memory approach enables rapid development and testing without database dependencies. The IStorage interface abstraction allows seamless migration to PostgreSQL persistence by swapping the storage implementation without changing business logic.

### Design System & UI Patterns

**Component Architecture**: Atomic design pattern with reusable UI primitives (buttons, cards, dialogs, forms) composed into feature components (GamePlayerModal, UploadGameForm).

**Gaming Portal Aesthetic**: 
- Dark-first color scheme with neutral base colors
- High contrast borders and shadows
- Hover effects with scale transforms and shadow elevation
- Large, bold typography using Poppins (700-900 weight for headings)
- 16:9 aspect ratio game thumbnails
- Grid-based responsive layouts (2-4 columns)

**Modal-Based Gameplay**: Games open in full-screen dialogs with escape-to-close functionality. The modal loads game HTML in an iframe using dynamically created blob URLs for security isolation.

**Responsive Design**: Mobile-first approach with Tailwind breakpoints (sm, md, lg) ensuring usability across devices. Upload forms and game grids adapt to screen sizes.

### External Dependencies

**UI Component Libraries**:
- @radix-ui/* - Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- lucide-react - Icon library for consistent iconography
- class-variance-authority - Component variant management
- tailwindcss - Utility-first CSS framework

**Data & Validation**:
- @tanstack/react-query - Server state management and caching
- react-hook-form - Form state and validation
- zod - Schema validation and type inference
- drizzle-zod - Zod schema generation from Drizzle ORM schemas

**Database (Configured but Not Active)**:
- @neondatabase/serverless - PostgreSQL serverless driver for Neon
- drizzle-orm - TypeScript ORM for database operations
- drizzle-kit - Migration and schema management tooling

**File Handling**:
- multer - Multipart form data parsing for file uploads
- @types/multer - TypeScript definitions

**Development Tools**:
- vite - Fast build tool and dev server with HMR
- @vitejs/plugin-react - React integration for Vite
- @replit/vite-plugin-* - Replit-specific dev experience enhancements
- tsx - TypeScript execution for development server
- esbuild - Fast bundler for production builds

**Session Management (Configured)**:
- express-session - Session middleware (configured but not actively used)
- connect-pg-simple - PostgreSQL session store (configured for future use)

**Font Integration**: Google Fonts (Poppins) loaded via CDN in index.html for consistent typography.

## Quick Commands

**Mobile Push Code (Git Push to GitHub):**
```bash
git push https://s0408270-maker:YOUR_GITHUB_TOKEN@github.com/s0408270-maker/Gamehub.git main
```
When user says "give me the mobile push code", run this git push command.