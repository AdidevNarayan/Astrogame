/* ====================================================================
   MOON BASE KEEPER — JUNIOR ASTRONAUT MISSION TRAINER
   app.js — Core Game Logic, NASA DONKI API, Canvas Map & Dialogs
   ==================================================================== */

// Initialize Lucide Icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Audio SFX (Web Audio API) ---
let audioCtx = null;
let soundOn = true;

function playSound(type) {
  if (!soundOn) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g); g.connect(audioCtx.destination);

    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now); osc.stop(now + 0.04);
    } else if (type === 'alarm') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(840, now + 0.2);
      g.gain.setValueAtTime(0.12, now);
      g.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      g.gain.setValueAtTime(0.08, now);
      g.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    }
  } catch (e) { }
}

// --- NASA Real Space Weather Telemetry Data ---
const REAL_FLARES = [
  { classType: "C2.1", date: "Sol 1", note: "Quiet Sun condition." },
  { classType: "M1.2", date: "Sol 2", note: "Active solar region flare." },
  { classType: "C1.5", date: "Sol 3", note: "Calm solar wind." },
  { classType: "X2.4", date: "Sol 4", note: "Major solar flare CME earthward! Shields required." },
  { classType: "M3.0", date: "Sol 5", note: "Elevated proton radiation flux." },
  { classType: "C2.0", date: "Sol 6", note: "Calm surface background." },
  { classType: "C1.0", date: "Sol 7", note: "Clear ascent window." }
];

const NASA_OSDR_FACTS = [
  { code: "NASA Plant Biology (OSDR-137)", text: "Real NASA tests proved plants can sprout in lunar regolith simulant, but need protected soil nutrients to survive long-term." },
  { code: "Deep Space Radiation (OSDR-48)", text: "Deep space cosmic rays can harm cells. Active magnetic shielding blocks up to 85% of radiation particles during lunar missions." },
  { code: "NASA Twins Study", text: "Astronaut Scott Kelly spent a year in space while his twin Mark stayed on Earth. Scientists found humans adapt remarkably well to spaceflight!" },
  { code: "Water Recycling (OSDR-311)", text: "ECLSS life support on the space station recycles 98% of all water, including sweat and breath condensation, turning it into fresh drinking water." },
  { code: "Bone Health in Space (OSDR-246)", text: "In Moon's low gravity (1/6th of Earth), bones can lose density. Daily exercise and healthy calcium keep astronauts strong." },
  { code: "Moon Dust Shielding (NASA Glenn)", text: "Moon dust is sharp as crushed glass! Future spacesuits use electrodynamic shields to push dust away before entering the habitat." },
  { code: "Astronaut Sleep (OSDR-520)", text: "Circadian lighting cycles inside space habitats help astronauts maintain deep, healthy sleep for high-focus moonwalks." }
];

// --- 7-Day Artemis Mission Dilemmas (Plain Language First) ---
const DAILY_DILEMMAS = [
  {
    day: 1,
    badge: "Day 1: Where Should We Land?",
    title: "Touchdown on the Lunar South Pole",
    desc: "Our spaceship has arrived! Choose where the Starship lander touches down on the Moon.",
    choices: [
      {
        id: "safe_plain",
        title: "Safe Flat Basin",
        plainDesc: "A smooth, easy landing. Zero hull damage, but fewer scientific rock formations nearby.",
        tag: "100% Safe · +3 Science · +4 Supplies",
        fx: { sci: 3, mat: 4, hp: 0, o2: 0, pw: 0 },
        isRisky: false
      },
      {
        id: "rough_rim",
        title: "Crater Rim Near Ice",
        plainDesc: "Touches down near frozen craters! Thruster vibrations cause a rough bump, but yields rich geology.",
        tag: "High Science (+8) · Bumpy Landing (−8 Health)",
        fx: { sci: 8, mat: 2, hp: -8, o2: 0, pw: 0 },
        isRisky: true
      }
    ]
  },
  {
    day: 2,
    badge: "Day 2: Habitat Check",
    title: "A Hidden Air Leak in the Valve",
    desc: "Elena detects a small hiss of pressure from an airlock seal.",
    choices: [
      {
        id: "fix_leak",
        title: "Fix the Leak Right Now",
        plainDesc: "Elena spends power and spare supplies to weld the seal shut safely.",
        tag: "Spends 2 Supplies · Keeps Air Safe (+4)",
        fx: { pw: -2, mat: -2, o2: 4, hp: 0, sci: 1 },
        isRisky: false
      },
      {
        id: "save_power",
        title: "Monitor the Leak & Save Power",
        plainDesc: "Save electricity for the science sensors today, but air keeps escaping into space.",
        tag: "Saves Power (+2) · Loses Air (−6)",
        fx: { pw: 2, o2: -6, sci: 4, hp: 0, mat: 0 },
        isRisky: true
      }
    ]
  },
  {
    day: 3,
    badge: "Day 3: Moon Rocks & Science",
    title: "Collecting Ancient Lunar Samples",
    desc: "Dr. Kim and Commander Chen gear up for the first big moonwalk outside.",
    choices: [
      {
        id: "long_eva",
        title: "Long 6-Hour Moonwalk",
        plainDesc: "Trek into deep trenches to find rare volcanic rocks. Uses extra oxygen from your tanks.",
        tag: "Big Discovery (+12 Science) · Uses Air (−6)",
        fx: { o2: -6, sci: 12, hp: -3, pw: -2, mat: 1 },
        isRisky: true
      },
      {
        id: "safe_walk",
        title: "Stay Close to Base",
        plainDesc: "Collect surface rocks within 50 meters of the airlock, conserving all oxygen and supplies.",
        tag: "Conserves Oxygen · Safe +5 Science",
        fx: { o2: 0, sci: 5, mat: 2, hp: 0, pw: 0 },
        isRisky: false
      }
    ]
  },
  {
    day: 4,
    badge: "Day 4: Search for Water Ice",
    title: "Water Ice in the Dark Crater",
    desc: "We reach the permanently shadowed crater where temperatures drop to −240°C.",
    choices: [
      {
        id: "deep_drill",
        title: "Drill Deep into Frozen Ice",
        plainDesc: "High power draw to run the heated drill, but confirms real water ice for the mission!",
        tag: "CONFIRMS WATER ICE! · Uses 4 Power",
        fx: { pw: -4, sci: 14, iceFound: true, mat: 2, hp: 0, o2: 0 },
        isRisky: true
      },
      {
        id: "quick_scan",
        title: "Quick Laser Scan Only",
        plainDesc: "A quick surface scan without drilling. Saves power, but cannot collect ice samples.",
        tag: "Saves Power · No Direct Ice Sample (+6 Science)",
        fx: { pw: 0, sci: 6, iceFound: false, mat: 1, hp: 0, o2: 0 },
        isRisky: false
      }
    ]
  },
  {
    day: 5,
    badge: "Day 5: Power Grid Glitch",
    title: "Electrical Breaker Overheating",
    desc: "A circuit breaker in the main electrical bus trips with a sudden spark.",
    choices: [
      {
        id: "repair_breaker",
        title: "Elena Executes Full Repair",
        plainDesc: "Our Engineering Specialist replaces the fried cable with spare parts.",
        tag: "Spends 3 Supplies · Restores Safe Power (+3)",
        fx: { mat: -3, pw: 3, hp: 4, o2: 2, sci: 0 },
        isRisky: false
      },
      {
        id: "bypass_breaker",
        title: "Bypass System to Power Lab",
        plainDesc: "Ignore the warning buzzer to keep science running, risking a electrical breakdown.",
        tag: "+10 Science · Risk Major Damage (−12 Health)",
        fx: { sci: 10, pw: -3, hp: -12, mat: 0, o2: -2 },
        isRisky: true
      }
    ]
  },
  {
    day: 6,
    badge: "Day 6: Moon Rover Trip",
    title: "Driving Across the Lunar Ridge",
    desc: "Time to drive our electric Moon Rover toward Malapert Mountain.",
    choices: [
      {
        id: "far_mountain",
        title: "Drive Far to the Mountain Peak",
        plainDesc: "A daring long drive to the summit for a telescope site and rare crystal minerals.",
        tag: "Max Science (+16) · Safety Risk (−5 Air, −6 Health)",
        fx: { sci: 16, o2: -5, hp: -6, roverMile: 2, pw: -2 },
        isRisky: true
      },
      {
        id: "near_patrol",
        title: "Drive Around the Outpost Perimeter",
        plainDesc: "Stay within sight of the habitat dome. Safe, calm, and keeps a wide safety margin.",
        tag: "100% Safe · +6 Science · Recovers Morale (+4 Health)",
        fx: { sci: 6, o2: 2, hp: 4, roverMile: 1, pw: 0 },
        isRisky: false
      }
    ]
  },
  {
    day: 7,
    badge: "Day 7: Getting Ready to Leave!",
    title: "Ascent Stage Preparation",
    desc: "Our final sol on the Moon! We need enough oxygen and power left to fire the ascent rocket engines.",
    choices: [
      {
        id: "safe_ascent",
        title: "Full Systems Flight Check",
        plainDesc: "Double-check every rocket valve and guidance sensor to guarantee a smooth flight to Gateway.",
        tag: "100% Flight Safety Guarantee",
        fx: { sci: 5, hp: 10, o2: 2, pw: 0 },
        isRisky: false
      },
      {
        id: "pack_cargo",
        title: "Pack Extra 20kg of Moon Rocks",
        plainDesc: "Pack the ascent lockers full of Moon samples for scientists back on Earth.",
        tag: "Massive Science Haul (+15) · Uses Fuel & Power (−2)",
        fx: { sci: 15, pw: -2, o2: -3, hp: 0 },
        isRisky: true
      }
    ]
  }
];

// --- Building Definitions ---
const BUILDINGS = {
  solar: { name: "Solar Panel", cost: 3, pwGen: 4, o2Gen: 0, pwUse: 0, desc: "Generates +4 Power from sunlight", unlocked: true },
  gen: { name: "Air Maker", cost: 4, pwGen: 0, o2Gen: 6, pwUse: 3, desc: "Uses 3 Power to produce +6 Air", unlocked: true },
  shield: { name: "Radiation Shield", cost: 5, pwGen: 0, o2Gen: 0, pwUse: 2, desc: "Uses 2 Power to block solar flares", unlocked: true },
  green: { name: "Greenhouse", cost: 4, pwGen: 0, o2Gen: 2, pwUse: 2, desc: "Grows fresh plants (+2 Air, +4 Health)", unlocked: false },
  lab: { name: "Science Lab", cost: 4, pwGen: 0, o2Gen: -1, pwUse: 2, desc: "Studies Moon rocks (+3 Science)", unlocked: false },
  battery: { name: "Battery Bank", cost: 3, pwGen: 0, o2Gen: 0, pwUse: 0, desc: "Stores +8 extra Power for emergencies", unlocked: false }
};

// --- Game State ---
const COLS = 8, ROWS = 6, HAB_INDEX = 2 * COLS + 3; // Hab at row 2, col 3
let S = {
  day: 0,
  pw: 10,
  o2: 25,
  hp: 100,
  sci: 0,
  mat: 12,
  grid: Array(COLS * ROWS).fill(null),
  selBuild: "solar",
  orbitUsedToday: false,
  vetoAvailable: true,
  waterIceConfirmed: false,
  roverMiles: 0,
  solarStormsBlocked: 0,
  unlockedTech: {},
  curChoiceIndex: 0,
  flares: REAL_FLARES,
  tutorialStep: 1 // 1: Solar, 2: Air maker, 3: End day, 0: Done
};

// Starting Outpost Setup
S.grid[HAB_INDEX] = "hab";
S.grid[HAB_INDEX - 1] = "solar";
S.grid[HAB_INDEX + 1] = "gen";

// --- Large Canvas Tactical Map (760x420) ---
const canvas = document.getElementById('moonCanvas');
const ctx = canvas.getContext('2d');
const CS = 48; // Expanded large tile size
const GRID_OFF_X = 35, GRID_OFF_Y = 52;
let animTick = 0;

// High-End Vector Module Renderers
function drawModuleIcon(type, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;

  if (type === 'hab') {
    // Central Pressurized Dome
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'solar') {
    // Silicon Solar Photovoltaic Array
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(x + 5, y + 6, size - 10, size - 12);
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x + 5, y + 6, size - 10, size - 12);
    ctx.strokeStyle = '#00f0ff66';
    ctx.beginPath();
    ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y + size - 6);
    ctx.moveTo(x + 5, cy); ctx.lineTo(x + size - 5, cy);
    ctx.stroke();
  } else if (type === 'gen') {
    // ECLSS Oxygen Cylinders & Valve
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(cx - 13, cy - 13, 11, 26);
    ctx.fillRect(cx + 2, cy - 13, 11, 26);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cx - 13, cy - 13, 11, 26);
    ctx.strokeRect(cx + 2, cy - 13, 11, 26);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(cx - 10, cy - 17, 6, 4);
    ctx.fillRect(cx + 5, cy - 17, 6, 4);
  } else if (type === 'shield') {
    // Superconducting Deflector Core
    ctx.fillStyle = '#082f49';
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'green') {
    // Hydroponic Greenhouse Dome
    ctx.fillStyle = '#064e3b33';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(cx - 7, cy, 5, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'lab') {
    // Science Lab & Spectrometer
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(x + 5, y + 5, size - 10, size - 10);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 5, size - 10, size - 10);
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  } else if (type === 'battery') {
    // Battery Storage Bank
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 12, cy - 14, 24, 28);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(cx - 12, cy - 14, 24, 28);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(cx - 9, cy - 10, 18, 5);
    ctx.fillRect(cx - 9, cy - 2, 18, 5);
    ctx.fillRect(cx - 9, cy + 6, 18, 5);
  }
}

function drawMap() {
  animTick++;
  const w = canvas.width, h = canvas.height;

  // Space Surface Background
  ctx.fillStyle = '#060a16';
  ctx.fillRect(0, 0, w, h);

  // Background Crater Contours
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(560, 280, 85, 45, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(600, 95, 60, 32, 0, 0, Math.PI * 2); ctx.stroke();

  // Ice Crater (Permanently Shadowed Region)
  ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(600, 285, 62, 34, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 12px "Share Tech Mono", monospace';
  ctx.fillText('ICE CRATER (PSR)', 550, 290);

  // Landing Site with Starship Lander (Top-Right)
  const lzX = 610, lzY = 100;
  ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(lzX, lzY, 30, 0, Math.PI * 2); ctx.stroke();

  // Lander Silhouette
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(lzX, lzY - 18);
  ctx.lineTo(lzX + 12, lzY + 12);
  ctx.lineTo(lzX - 12, lzY + 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffb703';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(lzX - 12, lzY + 12); ctx.lineTo(lzX - 18, lzY + 22);
  ctx.moveTo(lzX + 12, lzY + 12); ctx.lineTo(lzX + 18, lzY + 22);
  ctx.stroke();
  ctx.fillStyle = '#ffb703';
  ctx.font = 'bold 11px "Share Tech Mono", monospace';
  ctx.fillText('LANDING PAD', lzX - 35, lzY + 36);

  // Animated Rover Path (Advances with S.day)
  ctx.strokeStyle = 'rgba(255, 183, 3, 0.85)';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(lzX, lzY + 16);
  const pathSteps = Math.min(6, S.day);
  const waypoints = [
    [lzX, lzY + 16],
    [540, 145],
    [510, 195],
    [485, 245],
    [545, 270],
    [595, 285],
    [650, 320]
  ];
  for (let i = 1; i <= pathSteps; i++) {
    ctx.lineTo(waypoints[i][0], waypoints[i][1]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Rover Vehicle at current waypoint
  const currentRover = waypoints[pathSteps];
  const rx = currentRover[0], ry = currentRover[1];
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(rx - 10, ry - 7, 20, 14);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(rx - 12, ry - 10, 5, 4);
  ctx.fillRect(rx + 7, ry - 10, 5, 4);
  ctx.fillRect(rx - 12, ry + 6, 5, 4);
  ctx.fillRect(rx + 7, ry + 6, 5, 4);
  ctx.fillStyle = '#ffb703';
  ctx.beginPath(); ctx.arc(rx + 10, ry, 3, 0, Math.PI * 2); ctx.fill();

  // Grid Tiles
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GRID_OFF_X + c * CS;
      const y = GRID_OFF_Y + r * CS;
      const idx = r * COLS + c;
      const bKey = S.grid[idx];

      // Outline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CS, CS);

      if (bKey) {
        drawModuleIcon(bKey, x, y, CS);
      }
    }
  }

  // Active Shield Wall Pulsing Visual Effect
  const shieldCount = S.grid.filter(k => k === 'shield').length;
  const flare = S.flares[S.day % S.flares.length];
  const isStorm = flare && /^[MX]/.test(flare.classType);

  if (shieldCount > 0) {
    const habGridX = GRID_OFF_X + 3 * CS + CS / 2;
    const habGridY = GRID_OFF_Y + 2 * CS + CS / 2;
    const shieldRadius = 62 + Math.sin(animTick * 0.08) * 3;
    const alpha = isStorm ? 0.6 : 0.22;

    ctx.strokeStyle = `rgba(0, 240, 255, ${alpha + 0.3})`;
    ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(habGridX, habGridY, shieldRadius, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }

  // Solar Storm Red Alert overlay if storm is active
  if (isStorm) {
    ctx.fillStyle = `rgba(255, 51, 102, ${0.12 + Math.sin(animTick * 0.1) * 0.06})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Gateway Orbit Icon (Pilot Vance moving overhead)
  const orbitX = 45 + ((animTick * 0.65) % (w - 90));
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(orbitX, 12, 20, 7);
  ctx.fillRect(orbitX - 7, 10, 5, 11);
  ctx.fillRect(orbitX + 22, 10, 5, 11);
  ctx.font = 'bold 11px "Share Tech Mono", monospace';
  ctx.fillText('GATEWAY (VANCE)', orbitX - 30, 32);

  requestAnimationFrame(drawMap);
}

// --- Canvas Click (Place & Dismantle Buildings) ---
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  const col = Math.floor((clickX - GRID_OFF_X) / CS);
  const row = Math.floor((clickY - GRID_OFF_Y) / CS);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  const idx = row * COLS + col;
  if (idx === HAB_INDEX) return; // Habitat cannot be moved

  const current = S.grid[idx];
  const selectedDef = BUILDINGS[S.selBuild];

  if (current) {
    // Dismantle building -> 50% refund
    const refund = Math.floor(BUILDINGS[current].cost / 2);
    S.mat += refund;
    S.grid[idx] = null;
    playSound('click');
    setDockInstruction(`Dismantled ${BUILDINGS[current].name}. Got +${refund} Supplies back.`);
  } else if (S.mat >= selectedDef.cost) {
    // Build module
    S.mat -= selectedDef.cost;
    S.grid[idx] = S.selBuild;
    playSound('beep');
    setDockInstruction(`Placed ${selectedDef.name}! (${selectedDef.cost} supplies used).`);

    // Progress Tutorial
    if (S.tutorialStep === 1 && S.selBuild === 'solar') {
      advanceTutorial(2);
    } else if (S.tutorialStep === 2 && S.selBuild === 'gen') {
      advanceTutorial(3);
    }
  } else {
    playSound('alarm');
    setDockInstruction(`Need ${selectedDef.cost} supplies for that building.`);
  }

  updateHUD();
});

function setDockInstruction(msg) {
  document.getElementById('dockInstructionText').textContent = msg;
}

// --- Tutorial Progression ---
function advanceTutorial(step) {
  S.tutorialStep = step;
  const banner = document.getElementById('tutorialBanner');
  const tag = document.getElementById('tutTag');
  const msg = document.getElementById('tutMsg');

  if (step === 1) {
    banner.classList.remove('hid');
    tag.textContent = "Step 1 of 3";
    msg.textContent = "Tap the 'Solar Panel' button below, then tap an empty spot on the Moon map!";
    selectBuilding('solar');
  } else if (step === 2) {
    banner.classList.remove('hid');
    tag.textContent = "Step 2 of 3";
    msg.textContent = "Great job! Now tap 'Air Maker' below and place it on the map to give your crew oxygen.";
    selectBuilding('gen');
  } else if (step === 3) {
    banner.classList.remove('hid');
    tag.textContent = "Step 3 of 3";
    msg.textContent = "Awesome! Now tap the big yellow 'End Day ▶' button to run your base!";
  } else {
    banner.classList.add('hid');
  }
}

document.getElementById('btnSkipTutorial').onclick = () => {
  advanceTutorial(0);
};

// --- Production Calculation ---
function calcProduction(isCalm) {
  let solarBoost = S.unlockedTech.perovskite ? 2 : 0;
  let eclssDiscount = S.unlockedTech.eclss ? 1 : 0;

  const solarCount = S.grid.filter(k => k === 'solar').length;
  const genCount = S.grid.filter(k => k === 'gen').length;
  const shieldCount = S.grid.filter(k => k === 'shield').length;
  const greenCount = S.grid.filter(k => k === 'green').length;
  const labCount = S.grid.filter(k => k === 'lab').length;
  const batCount = S.grid.filter(k => k === 'battery').length;

  const powerCap = 10 + batCount * 8;
  const solarGen = solarCount * (4 + solarBoost) * (isCalm ? 1 : 0.5);

  const powerDemand = 2 + (genCount * (3 - eclssDiscount)) + (shieldCount * 2) + (greenCount * 2) + (labCount * 2);
  const o2Gen = (genCount * 6) + (greenCount * 2) - 4 - labCount; // -4 crew breathing
  const healthGen = greenCount * 4;
  const sciGen = labCount * 3;

  return { powerCap, solarGen, powerDemand, o2Gen, healthGen, sciGen, shieldCount };
}

// --- HUD Refresh (3 Big Stats + Supplies/Science Badges) ---
function updateHUD() {
  const flare = S.flares[S.day % S.flares.length];
  const isStorm = flare && /^[MX]/.test(flare.classType);
  const prod = calcProduction(!isStorm);

  // 3 Big Stats
  document.getElementById('statPower').textContent = `${S.pw}/${prod.powerCap}`;
  document.getElementById('statAir').textContent = S.o2;
  document.getElementById('statHealth').textContent = `${S.hp}%`;

  // Dynamic Subtitles
  document.getElementById('subPower').textContent = `Making +${prod.solarGen}⚡ / Using ${prod.powerDemand}⚡`;
  document.getElementById('subAir').textContent = prod.o2Gen >= 0 ? `+${prod.o2Gen} Air per sol` : `${prod.o2Gen} Air deficit!`;
  document.getElementById('subHealth').textContent = S.hp > 75 ? "Optimal Vitality" : (S.hp > 40 ? "Caution: Wear & Tear" : "Critical Condition");

  // Top Nav Day Badge
  document.getElementById('badgeDay').textContent = `Day ${S.day + 1}/7`;

  // Supplies & Science Badges (Now near Construction Deck)
  document.getElementById('badgeSupplies').textContent = `${S.mat} Supplies`;
  document.getElementById('badgeScience').textContent = `${S.sci} Science`;

  // Solar Weather Badge
  const donkiBadge = document.getElementById('donkiBadge');
  if (isStorm) {
    donkiBadge.className = "donki-indicator storm";
    donkiBadge.innerHTML = `<i data-lucide="sun"></i> Solar Storm: Class ${flare.classType}!`;
  } else {
    donkiBadge.className = "donki-indicator";
    donkiBadge.innerHTML = `<i data-lucide="sun"></i> Sun: Calm (${flare.classType})`;
  }

  // Update Building Dock Buttons
  renderBuildingDock();
  refreshIcons();
}

// --- Building Dock Renderer (Start with 3, Unlock Rest via Research) ---
function renderBuildingDock() {
  const container = document.getElementById('buildSlotsContainer');
  container.innerHTML = '';

  for (const key in BUILDINGS) {
    const b = BUILDINGS[key];
    const isUnlocked = b.unlocked;

    const btn = document.createElement('button');
    btn.className = `build-card-btn ${S.selBuild === key ? 'active' : ''}`;
    btn.disabled = !isUnlocked;

    let iconName = "hammer";
    if (key === 'solar') iconName = "sun";
    else if (key === 'gen') iconName = "wind";
    else if (key === 'shield') iconName = "shield";
    else if (key === 'green') iconName = "sprout";
    else if (key === 'lab') iconName = "microscope";
    else if (key === 'battery') iconName = "battery-charging";

    btn.innerHTML = `
      <i data-lucide="${iconName}" style="width:20px;"></i>
      <span>${b.name}</span>
      <span class="build-cost-tag">${isUnlocked ? `${b.cost} 🧱` : 'Locked'}</span>
    `;

    if (isUnlocked) {
      btn.onclick = () => selectBuilding(key);
    }

    container.appendChild(btn);
  }
}

function selectBuilding(key) {
  playSound('click');
  S.selBuild = key;
  const b = BUILDINGS[key];
  setDockInstruction(`${b.name}: ${b.desc}. Costs ${b.cost} supplies. Tap an empty tile on the map.`);
  updateHUD();
}

// --- End Day Trigger: Opens Focused Daily Dilemma Popup ---
document.getElementById('btnEndDay').onclick = () => {
  playSound('beep');
  openDailyDilemmaPopup();
};

function openDailyDilemmaPopup() {
  const task = DAILY_DILEMMAS[S.day];
  document.getElementById('popupDilemmaBadge').textContent = task.badge;
  document.getElementById('popupDilemmaTitle').textContent = task.title;
  document.getElementById('popupDilemmaDesc').textContent = task.desc;

  const container = document.getElementById('popupChoiceContainer');
  container.innerHTML = '';
  S.curChoiceIndex = 0;

  task.choices.forEach((c, idx) => {
    const card = document.createElement('div');
    card.className = `dilemma-card-box ${idx === S.curChoiceIndex ? 'selected' : ''}`;
    card.innerHTML = `
      <div class="dilemma-opt-title">${c.title}</div>
      <div class="dilemma-opt-desc">${c.plainDesc}</div>
      <div class="dilemma-opt-pills">
        <span class="opt-pill ${c.isRisky ? 'bad' : 'good'}">${c.tag}</span>
      </div>
    `;

    card.onclick = () => {
      playSound('click');
      S.curChoiceIndex = idx;
      document.querySelectorAll('.dilemma-card-box').forEach((box, i) => {
        box.className = `dilemma-card-box ${i === idx ? 'selected' : ''}`;
      });
      checkEmergencyCallout();
    };

    container.appendChild(card);
  });

  checkEmergencyCallout();
  document.getElementById('dilemmaModal').classList.add('show');
  refreshIcons();
}

function checkEmergencyCallout() {
  const task = DAILY_DILEMMAS[S.day];
  const chosen = task.choices[S.curChoiceIndex];
  const callout = document.getElementById('emergencyCallout');

  if (chosen.isRisky && S.vetoAvailable) {
    callout.classList.remove('hid');
  } else {
    callout.classList.add('hid');
  }
}

// Commander's Veto Button
document.getElementById('btnEmergencyVeto').onclick = () => {
  if (!S.vetoAvailable) return;
  playSound('alarm');
  S.vetoAvailable = false;
  S.curChoiceIndex = 0; // Force safest choice
  document.getElementById('emergencyCallout').classList.add('hid');

  document.querySelectorAll('.dilemma-card-box').forEach((box, i) => {
    box.className = `dilemma-card-box ${i === 0 ? 'selected' : ''}`;
  });
  setDockInstruction("Commander Sarah Chen exercised emergency safety override!");
};

// Confirm & Execute Day
document.getElementById('btnConfirmDay').onclick = () => {
  document.getElementById('dilemmaModal').classList.remove('show');
  executeDayTurn();
};

// --- Execution of Day Turn ---
function executeDayTurn() {
  const task = DAILY_DILEMMAS[S.day];
  const chosen = task.choices[S.curChoiceIndex];
  const flare = S.flares[S.day % S.flares.length];
  const isStorm = flare && /^[MX]/.test(flare.classType);
  const prod = calcProduction(!isStorm);

  let logs = [];
  logs.push(`• Sol ${S.day + 1} Decision: "${chosen.title}".`);

  // 1. Crew Tasks
  const kimTask = document.getElementById('selectKim').value;
  const elenaTask = document.getElementById('selectElena').value;

  if (kimTask === 'sci') { S.sci += 3; logs.push("• Dr. Kim (Science Specialist): Analyzed rock samples (+3 Science)."); }
  if (kimTask === 'ice' && S.day === 3) { S.waterIceConfirmed = true; S.sci += 6; logs.push("• Dr. Kim: CONFIRMED WATER ICE in Shackleton Crater! (+6 Science)."); }
  if (kimTask === 'rest') { S.hp = Math.min(100, S.hp + 6); logs.push("• Dr. Kim: Rested and recovered health (+6 Health)."); }

  if (elenaTask === 'power') { S.pw = Math.min(prod.powerCap, S.pw + 3); logs.push("• Elena (Engineering Specialist): Cleaned dust off solar panels (+3 Power)."); }
  if (elenaTask === 'eclss') { S.o2 += 4; logs.push("• Elena: Tuned air makers (+4 Air)."); }
  if (elenaTask === 'repair' && S.day === 4) { S.hp = Math.min(100, S.hp + 8); logs.push("• Elena: Fixed electrical glitch quickly (+8 Health)!"); }
  if (elenaTask === 'rest') { S.hp = Math.min(100, S.hp + 6); logs.push("• Elena: Rested and recovered health (+6 Health)."); }

  // 2. Base Production
  const totalPower = S.pw + prod.solarGen;
  if (totalPower >= prod.powerDemand) {
    S.pw = Math.min(prod.powerCap, totalPower - prod.powerDemand);
    S.o2 += prod.o2Gen;
    S.hp = Math.min(100, S.hp + prod.healthGen);
    S.sci += prod.sciGen;
    logs.push(`• Daily Production: Panels made +${prod.solarGen} Power, used ${prod.powerDemand}. Net Air: ${prod.o2Gen >= 0 ? '+' : ''}${prod.o2Gen}.`);
  } else {
    S.pw = 0;
    S.o2 -= 6;
    S.hp -= 8;
    logs.push("⚠️ BROWNOUT! Not enough power. Air makers shut off. Health −8, Air −6.");
  }

  // 3. Dilemma Effects
  for (const k in chosen.fx) {
    if (k === 'iceFound' && chosen.fx.iceFound) { S.waterIceConfirmed = true; }
    else if (S[k] !== undefined) { S[k] += chosen.fx[k]; }
  }
  if (chosen.fx.roverMile) S.roverMiles += chosen.fx.roverMile;

  // 4. Solar Storm Flare Impact
  if (isStorm) {
    playSound('alarm');
    const baseDamage = flare.classType[0] === 'X' ? 36 : 20;
    const deflectorBonus = S.unlockedTech.deflector ? 100 : prod.shieldCount * 14;
    const blocked = Math.min(baseDamage, Math.round(baseDamage * (deflectorBonus / 100)));
    const damage = baseDamage - blocked;

    S.hp -= damage;
    if (damage <= 0) {
      S.solarStormsBlocked++;
      logs.push(`🛡️ SOLAR FLARE ${flare.classType}: Shields deflected 100% of the radiation!`);
    } else {
      logs.push(`⚠️ SOLAR FLARE ${flare.classType}: Radiation penetrated! Shields blocked ${blocked}, Crew took −${damage} Health.`);
    }
  }

  // Daily supply stipend
  S.mat += 3;
  logs.push("• 3D Supply Fabricator: Made +3 fresh supplies.");

  // Cap stats
  S.hp = Math.max(0, Math.min(100, S.hp));
  S.o2 = Math.max(0, S.o2);
  S.pw = Math.max(0, S.pw);

  updateHUD();

  // Failure Check
  if (S.o2 <= 0) return finishGame(false, "The outpost ran completely out of oxygen reserves.");
  if (S.hp <= 0) return finishGame(false, "Crew was incapacitated by radiation and physical stress.");

  // Open Daily Report Modal
  document.getElementById('reportModalTitle').textContent = `Sol ${S.day + 1} Mission Report`;
  document.getElementById('reportLogBox').innerHTML = logs.map(l => {
    let style = "";
    if (l.includes('⚠️') || l.includes('BROWNOUT')) style = 'style="color:#ff6b8b; font-weight:700;"';
    else if (l.includes('🛡️') || l.includes('CONFIRMED')) style = 'style="color:#10b981; font-weight:700;"';
    return `<div ${style}>${l}</div>`;
  }).join('');

  // Real NASA OSDR Fact
  const fact = NASA_OSDR_FACTS[S.day % NASA_OSDR_FACTS.length];
  document.getElementById('factCode').textContent = fact.code;
  document.getElementById('factText').textContent = fact.text;

  document.getElementById('btnNextSol').textContent = S.day >= 6 ? "Finish Mission & View Debrief ▶" : `Proceed to Sol ${S.day + 2} ▶`;
  document.getElementById('reportModal').classList.add('show');
  refreshIcons();
}

// Next Sol Button
document.getElementById('btnNextSol').onclick = () => {
  playSound('click');
  document.getElementById('reportModal').classList.remove('show');
  S.day++;

  if (S.day >= 7) {
    return finishGame(true, "Congratulations! All 7 Sols of Artemis IV survived and crew docked with Lunar Gateway.");
  }

  // Reset daily Orbit scan
  S.orbitUsedToday = false;
  document.getElementById('btnOrbitAction').disabled = false;
  document.getElementById('btnOrbitAction').textContent = "Run Telemetry Scan";

  if (S.tutorialStep === 3) {
    advanceTutorial(0); // Tutorial complete!
  }

  updateHUD();
};

// --- Game Over / Debriefing ---
function finishGame(isWin, message) {
  const baseScore = S.sci * 30 + S.hp * 10 + S.o2 * 5 + (S.waterIceConfirmed ? 300 : 0);
  const finalScore = isWin ? baseScore + 500 : Math.max(50, baseScore);

  document.getElementById('debriefTitle').textContent = isWin ? "Mission Accomplished!" : "Mission Aborted";
  document.getElementById('debriefMsg').textContent = message;
  document.getElementById('debriefScore').textContent = `FINAL SCORE: ${finalScore} PTS`;

  document.getElementById('resSurfaceCrew').textContent = isWin ? "2 / 2 (Dr. Kim & Elena Safe)" : "0 / 2 (Critical)";
  document.getElementById('resOrbitCrew').textContent = "2 / 2 (Vance & Chen in Orbit)";
  document.getElementById('resWaterIce').textContent = S.waterIceConfirmed ? "Yes! Discovered on Day 4 (+300 Pts)" : "No (Survey Only)";
  document.getElementById('resScience').textContent = `${S.sci} Points`;
  document.getElementById('resAir').textContent = `${S.o2} Units`;

  document.getElementById('playAreaCard').classList.add('hid');
  document.getElementById('debriefCard').classList.remove('hid');
  playSound(isWin ? 'success' : 'alarm');
}

// Restart
document.getElementById('btnRestart').onclick = () => {
  playSound('click');
  S.day = 0;
  S.pw = 10;
  S.o2 = 25;
  S.hp = 100;
  S.sci = 0;
  S.mat = 12;
  S.grid = Array(COLS * ROWS).fill(null);
  S.grid[HAB_INDEX] = "hab";
  S.grid[HAB_INDEX - 1] = "solar";
  S.grid[HAB_INDEX + 1] = "gen";
  S.orbitUsedToday = false;
  S.vetoAvailable = true;
  S.waterIceConfirmed = false;
  S.roverMiles = 0;
  S.solarStormsBlocked = 0;
  S.unlockedTech = {};

  BUILDINGS.green.unlocked = false;
  BUILDINGS.lab.unlocked = false;
  BUILDINGS.battery.unlocked = false;

  S.flares = S.flares.slice().sort(() => Math.random() - 0.5);

  document.getElementById('debriefCard').classList.add('hid');
  document.getElementById('playAreaCard').classList.remove('hid');
  selectBuilding('solar');
  updateHUD();
};

// --- Orbit Support (Pilot Vance) ---
document.getElementById('btnOrbitAction').onclick = () => {
  if (S.orbitUsedToday) return;
  playSound('beep');
  S.orbitUsedToday = true;
  document.getElementById('btnOrbitAction').disabled = true;
  document.getElementById('btnOrbitAction').textContent = "Scan Active ✅";
  S.sci += 2;
  setDockInstruction("Pilot Vance completed orbital scan: +2 Science points collected.");
  updateHUD();
};

// --- Research Tree Unlocks ---
window.buyTech = function (key, cost) {
  if (S.sci >= cost && !S.unlockedTech[key]) {
    S.sci -= cost;
    S.unlockedTech[key] = true;
    playSound('success');

    // Unlock corresponding buildings
    if (key === 'greenhouse') BUILDINGS.green.unlocked = true;
    if (key === 'labModule') BUILDINGS.lab.unlocked = true;
    if (key === 'batteryModule') BUILDINGS.battery.unlocked = true;

    setDockInstruction(`Unlocked ${key}! Check the building menu.`);
    updateHUD();
    renderResearchModal();
  } else {
    playSound('alarm');
  }
};

function renderResearchModal() {
  const techs = [
    { key: 'batteryModule', name: "Extra Battery Bank", plain: "Lithium-ion cells · NASA", cost: 6, desc: "Unlocks Battery Bank building (+8 Power storage)." },
    { key: 'perovskite', name: "Better Solar Panels", plain: "Perovskite cells · NASA Glenn", cost: 8, desc: "Solar panels produce +2 extra Power every day." },
    { key: 'greenhouse', name: "Food Greenhouse Module", plain: "Space crops · NASA Kennedy", cost: 10, desc: "Unlocks Greenhouse building (produces Air and restores Crew Health)." },
    { key: 'labModule', name: "Science Lab & Moon Drill", plain: "Deep coring · NASA VIPER", cost: 10, desc: "Unlocks Science Lab building to research samples." },
    { key: 'eclss', name: "Efficient Air Maker", plain: "Dual-loop ECLSS · NASA OSDR-311", cost: 10, desc: "Air makers use 1 less Power to run." },
    { key: 'deflector', name: "Super Radiation Shield", plain: "Superconducting deflector · NASA OSDR-48", cost: 14, desc: "Shields block 100% of solar storm flares!" }
  ];

  const grid = document.getElementById('researchGrid');
  grid.innerHTML = '';

  techs.forEach(t => {
    const isUnlocked = S.unlockedTech[t.key];
    const canAfford = S.sci >= t.cost;

    const div = document.createElement('div');
    div.style = "background: rgba(30, 41, 59, 0.7); border: 1px solid #273553; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 4px;";
    div.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <b style="font-size:1.05rem; color:#fff;">${t.name}</b>
        <span style="font-family:'Share Tech Mono', monospace; color:#c084fc; font-weight:700;">${t.cost} 🔬</span>
      </div>
      <div style="font-size:0.8rem; color:#ffb703;">${t.plain}</div>
      <div style="font-size:0.88rem; color:#94a3b8; margin: 4px 0;">${t.desc}</div>
      <button onclick="buyTech('${t.key}', ${t.cost})" ${isUnlocked ? 'disabled' : (canAfford ? '' : 'disabled')} style="background:${isUnlocked ? '#10b981' : (canAfford ? 'var(--purple-science)' : '#334155')}; color:${isUnlocked ? '#fff' : (canAfford ? '#000' : '#888')}; border:none; padding:6px 12px; border-radius:6px; font-weight:700; cursor:${canAfford && !isUnlocked ? 'pointer' : 'default'}; align-self:flex-start; margin-top:4px;">
        ${isUnlocked ? 'Unlocked ✅' : (canAfford ? 'Unlock Research' : 'Need More Science')}
      </button>
    `;
    grid.appendChild(div);
  });
}

// --- Navigation Modal Openers ---
document.getElementById('btnOpenCrew').onclick = () => {
  playSound('click');
  document.getElementById('crewModal').classList.add('show');
  refreshIcons();
};
document.getElementById('btnOpenResearch').onclick = () => {
  playSound('click');
  renderResearchModal();
  document.getElementById('researchModal').classList.add('show');
};
document.getElementById('btnOpenGoals').onclick = () => {
  playSound('click');
  document.getElementById('goalsModal').classList.add('show');
};
document.getElementById('btnAttribution').onclick = () => {
  playSound('click');
  document.getElementById('attribModal').classList.add('show');
};

// Modal Close buttons
document.querySelectorAll('.btn-close-modal').forEach(btn => {
  btn.onclick = () => {
    playSound('click');
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  };
});

window.onclick = e => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('show');
  }
};

// Audio Toggle
document.getElementById('btnAudioToggle').onclick = () => {
  soundOn = !soundOn;
  document.getElementById('audioBtnText').textContent = soundOn ? "SFX On" : "SFX Muted";
};

// --- Live NASA DONKI API Fetch ---
async function fetchDONKI() {
  try {
    const end = new Date();
    const start = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const fmt = d => d.toISOString().slice(0, 10);
    const resp = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=DEMO_KEY`, { signal: AbortSignal.timeout(3500) });
    if (!resp.ok) throw 0;
    const d = await resp.json();
    if (Array.isArray(d) && d.length >= 7) {
      const step = Math.floor(d.length / 7);
      S.flares = [0, 1, 2, 3, 4, 5, 6].map(i => ({
        classType: d[i * step].classType || "C2.0",
        date: d[i * step].flrID ? d[i * step].flrID.slice(0, 10) : "Live Flare",
        note: `NASA GSFC DONKI observation.`
      }));
    }
  } catch (e) {
    S.flares = REAL_FLARES;
  }
}

// --- Initialize Game ---
async function init() {
  await fetchDONKI();
  advanceTutorial(1);
  updateHUD();
  drawMap();
  refreshIcons();
}

init();
