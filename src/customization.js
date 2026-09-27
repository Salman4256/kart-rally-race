// Kart Customization: paint colors, wheel rim styles, decals, and persistence
export const PAINT_OPTIONS = [
  { id: 'default', name: 'CHARACTER DEFAULT', color: null, accent: null },
  { id: 'crimson', name: 'CRIMSON FURY', color: 0xe52521, accent: 0xffffff },
  { id: 'cyan', name: 'CYBER CYAN', color: 0x00e5ff, accent: 0x111111 },
  { id: 'solar', name: 'SOLAR YELLOW', color: 0xffd214, accent: 0x222222 },
  { id: 'emerald', name: 'EMERALD GREEN', color: 0x00e676, accent: 0x004d40 },
  { id: 'sunset', name: 'SUNSET ORANGE', color: 0xff6f00, accent: 0xffd54f },
  { id: 'violet', name: 'ROYAL VIOLET', color: 0x8a2be2, accent: 0xe040fb },
  { id: 'obsidian', name: 'OBSIDIAN BLACK', color: 0x181818, accent: 0xe52521 },
  { id: 'pearl', name: 'PEARL WHITE', color: 0xf5f7fb, accent: 0x3d5afe },
];

export const WHEEL_OPTIONS = [
  { id: 'default', name: 'STOCK WHEELS', rim: null, spoke: null },
  { id: 'gold', name: 'GOLD PRO SPOKE', rim: 0xffd700, spoke: 0xb8860b },
  { id: 'chrome', name: 'CHROME STAR', rim: 0xffffff, spoke: 0xb0bec5 },
  { id: 'cyber', name: 'CYBER NEON', rim: 0x00e5ff, spoke: 0x00838f },
  { id: 'shadow', name: 'SHADOW CARBON', rim: 0x141414, spoke: 0x2b2b2b },
  { id: 'magenta', name: 'HYPER MAGENTA', rim: 0xff007f, spoke: 0x880044 },
];

export const DECAL_OPTIONS = [
  { id: 'default', name: 'RACER NUMBER' },
  { id: 'stripes', name: 'RACING STRIPES' },
  { id: 'checker', name: 'CHECKER FLAG' },
  { id: 'flame', name: 'FLAME ACCENT' },
];

const STORAGE_KEY = 'tkr-customization';

export function loadCustomization() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return {
    paintIndex: 0,
    wheelIndex: 0,
    decalIndex: 0,
  };
}

export function saveCustomization(custom) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
  } catch (e) { /* ignore */ }
}

export function getCustomizationValues(custom) {
  const c = custom || loadCustomization();
  const paint = PAINT_OPTIONS[c.paintIndex % PAINT_OPTIONS.length] || PAINT_OPTIONS[0];
  const wheel = WHEEL_OPTIONS[c.wheelIndex % WHEEL_OPTIONS.length] || WHEEL_OPTIONS[0];
  const decal = DECAL_OPTIONS[c.decalIndex % DECAL_OPTIONS.length] || DECAL_OPTIONS[0];
  return { paint, wheel, decal };
}
