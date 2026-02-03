# LiveSync Design

**Professional Audio System Design Tool** -- 3D spatial modeling for live sound, rigging, and system engineering.

LiveSync Design is a browser-based application for designing and simulating professional audio systems. It provides real-time 3D visualization of speaker placement, coverage analysis, rigging physics, and signal flow -- all running client-side with no backend required.

## Features

### 3D Spatial Modeling
- Interactive 3D viewport with orbit, pan, and zoom camera controls
- Perspective, top, and side orthographic view modes
- Grid snapping and continuous placement mode
- Layer management with visibility and lock controls
- Tape measure tool for distance measurements
- Undo/Redo history

### Audio System Design
- **11 speaker models** from the L-Acoustics catalog (K1, K2, K3, Kara II, KS28, SB18, Syva, X15, X12)
- Line array configuration with splay angles and site angle control
- Throw distance visualization
- Per-speaker frequency response data (125Hz -- 8kHz)

### Advanced Acoustics (Phase 4)
- **Multi-band SPL analysis** across 7 octave bands (125Hz -- 8kHz)
- **A-weighted composite** calculation (ISO standard)
- **Air absorption** modeling per ISO 9613-1
- **Room reflections** -- first-order mirror image method with 5 material types
- **Obstacle occlusion** -- Fresnel zone diffraction and shadow detection
- **Frequency-dependent directivity** with line array coupling
- **Coverage grid heatmap** -- color-coded SPL visualization at configurable height
- **Frequency response chart** -- SVG graph showing per-speaker response curves

### Rigging Physics (Phase 2)
- Catenary curve visualization for cable sag
- BGV-C1 safety factor compliance (5:1 minimum)
- Load distribution analysis
- Beam deflection calculations
- Real-time safety warnings with color-coded tension display
- Web Worker offloading for 60 FPS performance

### System Engineering (Phase 6)
- Port-based connectivity (XLR, Speakon, PowerCon, EtherCon)
- Audio signal flow validation (direction and type checking)
- Cable type management (signal, power, network)
- Parallel impedance calculation
- Amplifier headroom analysis

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 18.3.1 |
| 3D Engine | Three.js | 0.164.1 |
| React 3D | @react-three/fiber | 8.16.6 |
| 3D Helpers | @react-three/drei | 9.105.6 |
| State | Zustand | 4.5.2 |
| Icons | Lucide React | 0.378.0 |
| Build | Vite | 6.x |
| Language | TypeScript | 5.8.x |
| Testing | Vitest | 4.x |
| CSS | Tailwind CSS (CDN) | Latest |

## Getting Started

### Prerequisites

- **Node.js** >= 18

### Install and Run

```bash
# Clone the repository
git clone https://github.com/abrinay1997-stack/LiveSync-Desing.git
cd LiveSync-Desing

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app opens at [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build to dist/
npm run preview  # Preview the production build
npm test         # Run unit tests (vitest)
```

## Project Structure

```
LiveSync-Desing/
├── App.tsx                         # Root component (3D + UI layers)
├── index.tsx                       # React DOM entry point
├── index.html                      # HTML template with Tailwind + import maps
├── store.ts                        # Zustand store (5 slices)
├── types.ts                        # Core TypeScript interfaces
│
├── components/
│   ├── layout/                     # Interface, Scene3D, sidebars
│   ├── panels/                     # Properties, Layers, Library, Acoustic controls
│   ├── inspectors/                 # Geometry, Transform, Rigging, Array, Acoustic
│   ├── renderers/                  # Speaker, Structure, Ghost, Zone renderers
│   ├── scene/                      # 3D objects, cables, SPL viz, camera
│   ├── managers/                   # Keyboard shortcuts
│   └── ui/                         # Toolbar, Navigation, TopBar
│
├── data/
│   ├── library.ts                  # Combined asset registry
│   └── assets/
│       ├── audio.ts                # Speaker specs (11 models)
│       ├── rigging.ts              # Truss, motors, bumpers
│       ├── venue.ts                # Stage, audience zones
│       └── amplifiers.ts           # Amps, processors, consoles
│
├── utils/
│   ├── acoustics/                  # Phase 4: Advanced acoustics engine
│   │   ├── frequencyAnalysis.ts    # Octave band analysis, A-weighting
│   │   ├── reflections.ts          # Room reflections, Sabine RT60
│   │   ├── occlusion.ts            # Obstacle detection, Fresnel zones
│   │   ├── directivity.ts          # Polar patterns, line array coupling
│   │   ├── raycast.ts              # Acoustic ray casting
│   │   ├── SPLCalculator.ts        # Multi-source SPL with env support
│   │   ├── coverageGrid.ts         # Grid generation for heatmaps
│   │   └── __tests__/              # 57 unit tests
│   ├── physics/                    # Phase 2: Rigging physics
│   │   ├── catenary.ts             # Cable sag curves
│   │   ├── loadDistribution.ts     # BGV-C1 safety factors
│   │   ├── geometry.ts             # Cable angles and tension
│   │   ├── deflection.ts           # Beam theory
│   │   └── __tests__/              # Physics tests
│   ├── system/                     # Phase 6: System engineering
│   │   ├── signalFlow.ts           # Port validation
│   │   └── electricalAnalysis.ts   # Impedance, headroom
│   ├── factory.ts                  # Object creation factory
│   ├── arrayMath.ts                # Line array geometry
│   └── snapping.ts                 # Grid snapping logic
│
├── store/
│   ├── types.ts                    # State interfaces
│   └── slices/
│       ├── historySlice.ts         # Undo/Redo
│       ├── sceneSlice.ts           # Objects, layers, cables
│       ├── interactionSlice.ts     # Tools, selection, camera
│       ├── uiSlice.ts              # UI state, SPL controls
│       └── systemSlice.ts          # Audio system state
│
├── services/
│   └── StorageService.ts           # Project persistence
│
├── hooks/
│   └── usePhysicsWorker.ts         # Web Worker interface
│
└── workers/
    └── physics.worker.ts           # Off-thread physics calc
```

## Acoustics Engine

The acoustic simulation engine models sound propagation through the following pipeline:

```
Speaker → Frequency Response (per band)
       → Distance Attenuation (inverse square law)
       → Air Absorption (ISO 9613-1)
       → Directivity Pattern (frequency-dependent)
       → Obstacle Occlusion (Fresnel zone)
       → Room Reflections (mirror image method)
       → Phase Interference Detection
       → A-Weighted Composite SPL
```

### Octave Bands

| Band | Air Absorption | A-Weight |
|------|---------------|----------|
| 125 Hz | 0.001 dB/m | -16.1 dB |
| 250 Hz | 0.003 dB/m | -8.6 dB |
| 500 Hz | 0.006 dB/m | -3.2 dB |
| 1 kHz | 0.012 dB/m | 0.0 dB |
| 2 kHz | 0.028 dB/m | +1.2 dB |
| 4 kHz | 0.082 dB/m | +1.0 dB |
| 8 kHz | 0.242 dB/m | -1.1 dB |

### Coverage Quality Levels

| SPL Range | Quality | Color |
|-----------|---------|-------|
| < 85 dB | Poor | Red |
| 85 -- 90 dB | Acceptable | Amber |
| 90 -- 100 dB | Good | Green |
| 100 -- 105 dB | Excellent | Emerald |
| > 105 dB | Excessive | Dark Red |

## Testing

```bash
# Run all tests
npm test

# Run with watch mode
npx vitest

# Run specific test suite
npx vitest run utils/acoustics/__tests__/
npx vitest run utils/physics/__tests__/
npx vitest run utils/system/__tests__/
npx vitest run utils/__tests__/
npx vitest run data/__tests__/
```

## Deployment

### GitHub Pages

The project includes a GitHub Actions workflow for automatic deployment. Push to `main` to trigger:

```bash
# Manual build for GitHub Pages
npm run build
# Output in dist/ with correct base path
```

### Netlify

The project includes a `netlify.toml` configuration. To deploy:

1. Connect your GitHub repository to Netlify
2. Build settings are auto-detected from `netlify.toml`
3. Every push triggers a new deployment

Or deploy manually:

```bash
npm run build
# Upload dist/ folder to Netlify
```

## Architecture

The application uses a layered architecture:

- **3D Layer** (`z-0`): Three.js scene rendered via React Three Fiber
- **UI Layer** (`z-10`): React overlay with `pointer-events-none` (interactive elements opt-in)
- **State**: Zustand store with 5 slices (history, scene, interaction, UI, system)
- **Workers**: Web Workers for physics calculations to maintain 60 FPS

All computation runs client-side. No server or API keys are required for core functionality.

## License

This project is proprietary software. All rights reserved.
