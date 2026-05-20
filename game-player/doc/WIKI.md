# Game Player — Wiki

## 1. Overview

Game Player is a general-purpose UI framework for building mobile VR and AR games. It provides a complete set of reusable UI components — a 4-mode touch joystick, a telemetry HUD, a resizable AI chat panel, and an extensible toolbox — all optimized for mobile browsers (iOS Safari/Chrome, Android Chrome).

The framework is designed as a pluggable UI layer. The 3D viewport is a replaceable slot: swap in any Three.js scene, AR camera feed, VR environment, or video stream from a physical drone or robot toy. The included demo uses a Crazyflie drone model to illustrate the control capabilities.

The app runs entirely in the browser as a Progressive Web App (PWA) — no native installation required. It can be added to the home screen on iOS/Android for a full-screen, app-like experience.

### Target Use Cases

- **Virtual VR games** — Control a character or camera in a fully virtual 3D world
- **AR games with physical drones** — Overlay controls on a live camera feed to pilot a real drone
- **AR games with robot toys** — Send movement commands to physical robots via WebSocket/BLE
- **3D simulation** — Training environments for drone/robot operation

---

## 2. Functionality

### 2.1 3D Viewport (Pluggable)

- The main viewport is a replaceable component slot for rendering any visual content
- The included demo renders a ground plane with a grid overlay and a 3D Crazyflie drone model (`.glb` format)
- In production, replace `ThreeScene.tsx` with your VR/AR scene, camera feed, or any React-compatible renderer
- The viewport receives a state object and renders accordingly — no coupling to specific game logic
- Powered by Three.js via `@react-three/fiber` and `@react-three/drei` in the demo

### 2.2 Joystick Control (4 Modes)

The joystick is a semi-transparent dual-circle overlay centered on the viewport. It generates velocity commands that can be mapped to any controllable entity. It supports four control modes, toggled by tapping the inner circle:

| Mode | Label | Control | Description |
|------|-------|---------|-------------|
| Move | M | X/Y translation | Drag in any direction to move horizontally |
| Rotate | R | Yaw rotation | Drag to rotate clockwise or counter-clockwise |
| Height | H | Z altitude | Drag up/down to raise or lower |
| Lens | L | Focal length | Drag left/right to zoom in or out (adjusts camera FOV) |

Mode cycle order: **M → R → H → L → M**

Visual indicators change per mode:
- **Move**: Straight arrows at 12:00, 3:00, 6:00, 9:00
- **Rotate**: Curved 30-degree arc arrows at 1:30, 4:30, 7:30, 10:30 with directional arrowheads
- **Height**: Vertical arrows at 12:00 and 6:00
- **Lens**: Horizontal arrows at 3:00 and 9:00

### 2.3 Telemetry HUD (Customizable)

A translucent heads-up display at the bottom of the viewport. The demo shows:
- Position: `x`, `y`, `z`
- Yaw angle in degrees
- Camera focal length value

In production, customize the HUD to display any telemetry relevant to your game: speed, health, battery, signal strength, latency, etc.

### 2.4 Chat Panel (Reusable)

A resizable panel at the bottom of the screen for AI-assisted in-game communication:
- Displays a scrollable message history (user and bot messages)
- Text input field with placeholder text
- **+** button to expand/collapse the toolbox
- **Drag handle** (gray pill) at the top for swipe-to-resize gesture
- Snaps to three heights: 15vh (collapsed), 30vh (default), 50vh (expanded)

### 2.5 Toolbox (Extensible)

An expandable grid of quick-action buttons accessible via the **+** button. The demo includes:
- Camera (拍照)
- Identify (识别)
- Game (游戏)
- Settings (设置)

Customize these buttons per game — add weapon selection, inventory, map, settings, or any game-specific actions.

### 2.6 PWA Capabilities

- Offline-capable via service worker (Workbox)
- Installable to home screen with app manifest
- Portrait-locked orientation
- Standalone display mode (no browser chrome)

---

## 3. System Architecture

### 3.1 High-Level Architecture

The framework follows a layered architecture with a clear separation between reusable UI components and game-specific logic:

```
┌─────────────────────────────────────────────────┐
│                   index.html                     │
│         (viewport-fit=cover, iOS meta)           │
├─────────────────────────────────────────────────┤
│                    main.tsx                       │
│              (React entry point)                 │
├─────────────────────────────────────────────────┤
│                    App.tsx                        │
│         (Root component, state hub)              │
├────────────┬────────────┬───────────┬───────────┤
│ YOUR SCENE │  Joystick   │    HUD    │ ChatPanel │
│ (replace)  │ (reusable) │(reusable) │(reusable) │
└────────────┴────────────┴───────────┴───────────┘
```

### 3.2 Component Hierarchy

```
App
├── [Your Scene]        — Pluggable 3D/AR/VR viewport
│   └── (demo: ThreeScene with AirportSquare, GridLines, DroneModel)
├── Joystick            — Touch input overlay (reusable)
│   ├── Move arrows     — SVG directional indicators
│   ├── Rotate arrows   — SVG arc indicators
│   ├── Height arrows   — SVG vertical indicators
│   ├── Lens arrows     — SVG horizontal indicators
│   └── Inner circle    — Mode toggle button
├── HUD                 — Telemetry display (reusable)
└── ChatPanel           — Chat + toolbox (reusable)
    ├── Drag handle     — Swipe-to-resize grip
    ├── Message list    — Scrollable chat history
    ├── Input bar       — Text input + action buttons
    └── Toolbox         — Expandable action grid
```

### 3.3 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 19 | Component-based UI |
| Language | TypeScript | Type safety |
| Build Tool | Vite 8 | Dev server, HMR, bundling |
| 3D Engine | Three.js + @react-three/fiber | WebGL rendering |
| 3D Helpers | @react-three/drei | Model loading, controls |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Animation | Framer Motion | Chat panel transitions |
| Icons | Lucide React | UI iconography |
| PWA | vite-plugin-pwa (Workbox) | Service worker, manifest |

---

## 4. Internal Workflow and Dataflow

### 4.1 State Management

All entity state is centralized in `App.tsx` as a single `EntityState` object. Extend this interface for your game:

```typescript
// Extend with your own fields (speed, health, battery, etc.)
interface EntityState {
  x: number;     // horizontal position (east-west)
  y: number;     // horizontal position (north-south)
  z: number;     // altitude (0.5 – 10)
  yaw: number;   // heading in degrees (0 – 360)
  focal: number; // camera focal length (1 – 10)
}
```

### 4.2 Velocity-Based Control Loop

The joystick does not directly set entity positions. Instead, it sets **velocity values** which are consumed by a persistent `requestAnimationFrame` loop:

```
User Touch → Joystick → velocityRef → Animation Loop → setState → Re-render
```

1. **Touch input**: The Joystick component captures touch/mouse events
2. **Velocity dispatch**: Based on the active mode, Joystick calls one of:
   - `onMove(vx, vy)` — sets horizontal velocities
   - `onRotate(vyaw)` — sets yaw velocity
   - `onHeight(vz)` — sets vertical velocity
   - `onFocal(vf)` — sets focal length change rate
3. **Animation loop** (`startLoop`): Runs via `requestAnimationFrame`, reads velocities from `velocityRef`, and updates state by `velocity * deltaTime (0.016s)` each frame
4. **Stop**: On finger release, `onStop()` zeros all velocities

This design ensures smooth, frame-rate-independent continuous movement. In production, replace the local state update with network commands (WebSocket, BLE, etc.) to control physical devices.

### 4.3 Joystick Input Processing

```
Touch Event
    │
    ├─ dist < 0.35 (inner circle) → Toggle mode (M→R→H→L→M)
    │
    └─ dist >= 0.35 (outer ring) → Calculate (dx, dy) relative to center
         │
         ├─ Move mode  → onMove(dx * 3, -dy * 3)
         ├─ Rotate mode → onRotate(±90) based on touch angle
         ├─ Height mode → onHeight(-dy * 3)
         └─ Lens mode  → onFocal(dx * 5)
```

The `dist` value is normalized (0 = center, 1 = edge). The threshold `0.35` separates the inner toggle circle from the outer control ring.

### 4.4 iOS Touch Event Handling

iOS browsers fire synthetic mouse events after touch events (`touchstart` → `touchend` → `mousedown` → `mouseup`). Without mitigation, this causes the mode toggle to fire twice per tap.

Solution: A `lastTouchTime` ref timestamps every touch event. Mouse event handlers check this timestamp and discard any mouse event within 500ms of the last touch.

```
touchstart → lastTouchTime = now, process event
touchend   → lastTouchTime = now, process event
mousedown  → if (now - lastTouchTime < 500) → DISCARD
mouseup    → if (now - lastTouchTime < 500) → DISCARD
```

### 4.5 Rendering Pipeline (Demo)

The demo scene maps entity state to Three.js transforms:

```
EntityState (App.tsx)
    │
    ├──→ ThreeScene (demo)
    │      └── DroneModel position = [state.x, state.z, -state.y]
    │          DroneModel rotation = [0, state.yaw * π/180, 0]
    │          Camera FOV = max(20, 75 - state.focal * 5)
    │
    └──→ HUD
           └── Display x, y, z, yaw, focal as text
```

Note the coordinate mapping: the app uses a right-hand coordinate system where `y` is forward, but Three.js uses `z` as depth. The mapping `[x, z, -y]` converts between the two.

For AR/VR games, replace this pipeline with your own rendering logic that consumes the state object.

### 4.6 Chat Panel Resize Flow

```
Touch on panel area
    │
    ├─ touchstart → record startY, startHeight
    ├─ touchmove  → deltaVh = (startY - currentY) / windowHeight * 100
    │               newHeight = clamp(startHeight + deltaVh, 15, 60)
    └─ touchend   → snap to nearest: 15vh / 30vh / 50vh
```

The 3D viewport height is `100 - chatHeight` vh, so expanding the chat panel shrinks the viewport proportionally.

### 4.7 Data Flow Diagram

```
┌──────────┐     velocity      ┌───────────┐    state     ┌────────────┐
│ Joystick │ ──────────────→  │  App.tsx   │ ──────────→ │ Your Scene │
│  (touch) │  onMove/onRotate │ (anim loop)│  entityState │  (VR/AR)   │
└──────────┘  onHeight/onFocal └───────────┘              └────────────┘
                                     │
                                     │ entityState
                                     ▼
                                ┌─────────┐
                                │   HUD   │
                                │ (text)  │
                                └─────────┘
```

For physical device control, insert a network layer between `App.tsx` and the device:

```
Joystick → App.tsx → WebSocket/BLE → Physical Drone/Robot
                  → Your Scene (local preview)
                  → HUD (telemetry)
```

### 4.8 Build and Deployment Pipeline

```
Source (src/)
    │
    ├─ npm run dev    → Vite dev server (HMR, port 5173)
    │
    └─ npm run build  → TypeScript compile → Vite bundle → dist/
         │
         ├─ index.html          — Entry HTML
         ├─ assets/             — JS/CSS bundles (hashed)
         ├─ models/             — Copied 3D assets
         ├─ manifest.webmanifest — PWA manifest
         ├─ sw.js               — Service worker (Workbox)
         └─ registerSW.js      — SW registration script
```

The `dist/` directory can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

---

## 5. Integration Patterns

### 5.1 VR Game Integration

Replace `ThreeScene.tsx` with your VR scene. The joystick callbacks map directly to character/camera movement:

```
onMove(vx, vy)   → Character horizontal movement
onRotate(vyaw)   → Camera/character yaw rotation
onHeight(vz)     → Character jump / fly altitude
onFocal(vf)      → Camera zoom / FOV adjustment
```

### 5.2 AR Drone Integration

Replace `ThreeScene.tsx` with a camera feed overlay. Map velocity commands to drone control protocol:

```
onMove(vx, vy)   → MAVLink SET_POSITION_TARGET
onRotate(vyaw)   → MAVLink yaw command
onHeight(vz)     → MAVLink altitude command
onFocal(vf)      → Camera gimbal zoom
```

### 5.3 Robot Toy Integration

Send velocity commands via WebSocket or Web Bluetooth:

```
onMove(vx, vy)   → BLE write motor speeds
onRotate(vyaw)   → BLE write differential steering
onHeight(vz)     → BLE write arm elevation
onFocal(vf)      → BLE write camera servo
```
