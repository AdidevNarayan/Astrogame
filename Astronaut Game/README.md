# Moon Base Keeper — Junior Astronaut Mission Trainer

A colony survival and resource management game inspired by [*Outpost*](https://leojalo.itch.io/outpost), set at the Lunar South Pole (Shackleton Crater rim). Players manage power, life support, radiation defense, science sampling, and flight crew assignments across a 7-sol Artemis mission expedition, powered by real scientific data from the NASA DONKI Space Weather API and the NASA Open Science Data Repository (OSDR).

---

## 🎨 Artwork & Asset Manifest

Custom illustrations and terrain art are organized inside the `./assets/` directory (`terrain`, `buildings`, `vehicles`, and `surface`).

| Filename / Relative Path | Category | In-Game Entity | Description & Purpose |
| :--- | :--- | :--- | :--- |
| `./assets/surface/moon-surface.png`<br>`./assets/terrain/moon-surface.png` | Terrain / Surface | **Lunar Surface Map** | High-resolution top-down lunar regolith background texture covering the entire tactical map grid. |
| `./assets/surface/ice-crater.png`<br>`./assets/terrain/ice-crater.png` | Terrain | **Shackleton Ice Crater** | Permanently Shadowed Region (PSR) crater feature located at the South Pole rim where subsurface water ice is surveyed. |
| `./assets/vehicles/artemis-lander.png`<br>`./assets/buildings/artemis-lander.png` | Vehicles / LZ | **Artemis Lunar Lander** | Touchdown vehicle situated at the landing site perimeter with descent/ascent stage modules and boot tracks leading to the base. |
| `./assets/buildings/hab-dome.png` | Buildings | **Hab Dome (`hab`)** | Central pressurized habitat dome providing astronaut living quarters and environmental hub (anchor of the colony). |
| `./assets/buildings/solar-panel.png` | Buildings | **Solar Array (`solar`)** | Articulated photovoltaic wings generating clean electrical power from low-elevation polar sunlight (+4⚡). |
| `./assets/buildings/air-maker.png` | Buildings | **Air Maker (`gen`)** | Regenerative ECLSS oxygen generation unit consuming power to produce breathable oxygen (+6🫁). |
| `./assets/buildings/radiation-shield.png` | Buildings | **Radiation Shield (`shield`)** | Electromagnetic deflector shield dome deployed to absorb and deflect coronal radiation during solar flare events. |
| `./assets/buildings/greenhouse.png` | Buildings | **Greenhouse (`green`)** | Lunar hydroponic dome cultivating fresh crops to boost crew health (+4❤️) and generate supplemental oxygen (+2🫁). |
| `./assets/buildings/science-lab.png` | Buildings | **Science Lab (`lab`)** | Multi-omics and lunar geology research workstation analyzing regolith core samples (+3🔬). |
| `./assets/buildings/battery-storage.png` | Buildings | **Battery Storage (`battery`)** | Lithium-ion energy storage assembly providing emergency power reserve capacity (+8⚡ power cap). |

---

## 🛡️ Resilient Placeholder & Fallback System

If any artwork file is missing, corrupted, or fails to load:
1. **Zero Crash Guarantee**: The game will never break, freeze, or halt execution.
2. **Procedural Vector Placeholders**: The rendering pipeline automatically falls back to lightweight, high-performance vector graphics and labeled tactical cards with building type tags and symbols.
3. **Multi-Directory Resolution**: The loader automatically checks mirror paths (e.g. `./assets/terrain/` vs `./assets/surface/`, and `./assets/vehicles/` vs `./assets/buildings/`) for maximum compatibility.

---

## 🚀 Game Features & Architecture

- **Three-Column Desktop Layout**: Left "Build & Orders" panel, Center Tactical Lunar Map (760×420 canvas), and Right "Colony Crew" & "Mission Goals" panel.
- **Space Weather Warning Card**: Live banner tracking incoming solar flares with progress bars, threat class levels, and preparation hints.
- **Interactive Feedback**:
  - Floating numbers (`+4⚡`, `-5❤️`, `-3📦`) above structures upon placement and turn resolution.
  - Resource chip color flashes on value changes.
  - Toast event notifications for milestones, scans, and warnings.
  - Web Audio synthesizer with sound effects and a top-bar mute button (`SFX`/`Muted`).
- **Mission Goals Progress Bars**: Live tracking for objectives (e.g. "Build 3 Solar Panels 0/3", "Collect 20 Science 0/20").
- **Accessibility**: All buttons ≥44px tall, body text ≥16px, and full support for `prefers-reduced-motion`.

