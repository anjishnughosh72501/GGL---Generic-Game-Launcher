# Fluent Hub - PC App & Game Hub

A refined desktop application for Windows that aggregates installed PC games and software across Steam, Epic Games, GOG, and Windows Start Menu / Registry, designed with the tactile aesthetics of Apple macOS, Spotify, and Notion.

---

## ✨ Design Direction & Materiality

- **Apple macOS & Notion Minimalism:** Replaces loud gamer neon aesthetics with zinc neutral scales, soft frosted glassmorphism (`backdrop-blur-md`), and clean 1px border strokes.
- **Color System:**
  - **Dark Mode:** Deep zinc tones (`#09090B`, `#18181B`, `#27272A`).
  - **Light Mode:** Warm paper whites (`#FAFAFA`, `#F4F4F5`, `#E4E4E7`).
  - Monochromatic elevation with refined emerald and subtle amber accents.
- **Typography:** Modern humanist sans-serif (`Inter`, `-apple-system`, `BlinkMacSystemFont`), balanced tracking and soft weights.
- **Framer Motion Micro-Interactions:** Smooth spring-damped hover scale, floating circular Spotify-style play button entrance, and fluid modal transitions.

---

## 🚀 Core Features

### 1. Smart "Add Program" Engine (Spotlight / Raycast Modal)
Press **`Ctrl + K`** or click **"Add Program"** to launch the Spotlight modal:
- **System Program Indexer:** Instantly searches across Windows Start Menu shortcuts (`%ProgramData%` and `%APPDATA%`) and Windows Registry Uninstall records. One-click **"Add to Hub"** action.
- **Custom File Picker:** Browse `.exe` or `.bat` binaries directly, assign category (*Game* or *Application*), configure custom launch parameters, and select custom cover artwork.

### 2. Multi-Tier Artwork & Icon Pipeline
No broken cards or blank boxes. Every item is resolved through a 4-tier pipeline:
1. **Tier 1 (Steam CDN):** High-res 600x900 vertical box art automatically loaded for Steam apps via `appid`.
2. **Tier 2 (Native Icon Extraction):** High-resolution icon resources extracted from `.exe` / `.ico` binaries via PowerShell and converted to PNG base64.
3. **Tier 3 (Web Cover Art):** Fallback URL / custom artwork.
4. **Tier 4 (Graceful Monogram Art):** Spotify/Notion-style minimalist card with soft gradient slate background and centered 2-letter monogram.

### 3. Multi-Platform Auto-Discovery
- **Steam:** Queries Windows Registry `HKCU\Software\Valve\Steam\SteamPath`, parses `libraryfolders.vdf` across all drives, extracts `appmanifest_<appid>.acf`. Launches via `steam://run/<appid>`.
- **Epic Games:** Scans `%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item`. Launches via `com.epicgames.launcher://apps/<AppName>?action=launch&silent=true`.
- **GOG & Generic:** Scans `HKLM\SOFTWARE\WOW6432Node\GOG.com\Games` and common install folders (`C:\Games`, `D:\Games`).

### 4. Flexible View Layouts
Switch effortlessly between three layouts:
- **2:3 Poster Grid:** Vertical cover cards with hover play overlays.
- **1:1 Square Grid:** Balanced square view ideal for desktop applications and tools.
- **Clean List View (Notion Table):** High-density table with icon, title, category badge, platform, last launched, launch count, and direct action triggers.

---

## 🛠 Tech Stack

- **Desktop Shell:** Electron (Node.js runtime + CommonJS desktop bridge)
- **Frontend:** React 19 + TypeScript + Vite 8
- **Styling:** Tailwind CSS + Framer Motion
- **Icons:** `lucide-react`
- **State & Store:** Zustand + local storage persistence
- **Testing:** Vitest

---

## 💻 Getting Started

### Development
```bash
# Start live development (Vite dev server + Electron with hot reload)
npm run dev

# Or run frontend-only preview in browser
npm run dev:vite
```

### Production Build & Launch
```bash
# Build TypeScript, Vite assets, and Electron bundle
npm run build

# Start the desktop application
npm start
```

### Running Tests
```bash
npm test
```
