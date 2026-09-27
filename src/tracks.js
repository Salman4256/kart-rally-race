// Track configurations registry.
// Each track is a data object consumed by createTrack(scene, renderer, config).
// CP = control points [x, y, z]; everything else references CP indices or absolute coords.

export const TRACKS = [
  // -----------------------------------------------------------------------------------------
  // 1. Palm Cove Circuit (the original)
  // -----------------------------------------------------------------------------------------
  {
    id: 'palm_cove',
    name: 'Palm Cove Circuit',
    description: 'A tropical coastal circuit with a bridge over the lagoon, sweeping corners, and a hairpin.',
    scale: 1.15,
    halfWidth: 12,
    cp: [
      [0, 0, -60],      // 0  start / finish
      [0, 0, 60],       // 1
      [2, 0, 175],      // 2
      [22, 1, 258],     // 3  big sweeping left
      [80, 3, 302],     // 4
      [160, 5, 296],    // 5
      [230, 6, 252],    // 6  sweeping right
      [262, 6, 182],    // 7
      [238, 5, 118],    // 8  S-bend
      [292, 4, 64],     // 9
      [258, 4, 4],      // 10
      [296, 6, -62],    // 11 climb to the bridge
      [304, 10, -140],  // 12 bridge over the lagoon
      [284, 10, -212],  // 13
      [226, 6, -262],   // 14 downhill jump
      [150, 3, -284],   // 15
      [66, 1, -300],    // 16
      [-20, 0, -318],   // 17 into the hairpin
      [-96, 0, -322],   // 18
      [-128, 0, -292],  // 19 hairpin apex
      [-106, 0, -256],  // 20
      [-50, 0, -236],   // 21
      [-8, 0, -196],    // 22
      [0, 0, -140],     // 23
    ],
    lake: { x: 405, z: -205, r: 125 },
    waterLevel: -1,
    boostPadCPs: [
      // cluster A — exit of the S-bend (staggered trio)
      { cp: 10.45, laterals: [-6, 0, 6], stepMultiplier: [0, 1, 2] },
      // cluster B — hairpin exit (pair, then centre)
      { cp: 20.55, laterals: [-4.5, 4.5], stepMultiplier: [0, 0] },
      { cp: 20.55, laterals: [0], stepMultiplier: [2] },
      // cluster C — lined up before the sweeper jump
      { cp: 4.15, laterals: ['racing', 'racing'], stepMultiplier: [0, 1] },
    ],
    ramps: [
      { cp: 14.35, halfWidth: 10, height: 1.7 },
      { cp: 4.65, halfWidth: 9, height: 1.5 },
    ],
    itemBoxRows: [1.25, 6.5, 9.2, 12.5, 16.4, 21.6],
    itemBoxLaterals: [-8, -4, 0, 4, 8],
    theme: 'tropical',
  },

  // -----------------------------------------------------------------------------------------
  // 2. Ember Canyon — Desert / volcanic
  // -----------------------------------------------------------------------------------------
  {
    id: 'ember_canyon',
    name: 'Ember Canyon',
    description: 'A scorching desert canyon with tight switchbacks, a lava lake, and long straights through red rock.',
    scale: 1.05,
    halfWidth: 11,
    cp: [
      [0, 0, -40],       // 0  start / finish straight
      [0, 0, 80],        // 1
      [0, 0, 180],       // 2  long straight through canyon
      [40, 2, 260],      // 3  gentle right
      [110, 4, 300],     // 4
      [180, 6, 280],     // 5  wide sweeper left
      [230, 8, 220],     // 6
      [260, 10, 140],    // 7  climb up the mesa
      [240, 12, 60],     // 8  mesa top switchback
      [200, 12, 0],      // 9
      [240, 10, -60],    // 10 switchback return
      [280, 8, -120],    // 11
      [300, 6, -200],    // 12 descent near lava lake
      [260, 4, -280],    // 13
      [180, 2, -310],    // 14 tight S through narrow canyon
      [120, 2, -280],    // 15
      [80, 2, -220],     // 16
      [40, 1, -320],     // 17 big sweeping right
      [-40, 0, -340],    // 18
      [-100, 0, -300],   // 19 hairpin around rock pillar
      [-80, 0, -240],    // 20
      [-40, 0, -180],    // 21
      [0, 0, -120],      // 22
    ],
    lake: { x: 380, z: -240, r: 100 },
    waterLevel: -2,
    boostPadCPs: [
      { cp: 2.3, laterals: [0], stepMultiplier: [0] },
      { cp: 2.3, laterals: [-4, 4], stepMultiplier: [1, 1] },
      { cp: 8.5, laterals: ['racing'], stepMultiplier: [0] },
      { cp: 15.4, laterals: [-5, 5], stepMultiplier: [0, 0] },
      { cp: 20.6, laterals: [0, 0], stepMultiplier: [0, 1] },
    ],
    ramps: [
      { cp: 7.3, halfWidth: 9, height: 2.0 },
      { cp: 13.5, halfWidth: 8, height: 1.8 },
    ],
    itemBoxRows: [1.5, 5.0, 8.2, 11.5, 14.8, 19.5],
    itemBoxLaterals: [-7, -3.5, 0, 3.5, 7],
    theme: 'desert',
  },

  // -----------------------------------------------------------------------------------------
  // 3. Frosted Peaks — Snow / ice
  // -----------------------------------------------------------------------------------------
  {
    id: 'frosted_peaks',
    name: 'Frosted Peaks',
    description: 'An icy mountain circuit with wide sweepers through pine forests, a frozen lake crossing, and a ski jump.',
    scale: 1.2,
    halfWidth: 13,
    cp: [
      [0, 0, -50],      // 0  start / finish (village straight)
      [0, 0, 60],       // 1
      [0, 0, 160],      // 2
      [-40, 2, 250],    // 3  gentle left through pine forest
      [-110, 5, 310],   // 4
      [-190, 8, 300],   // 5  wide right sweeper uphill
      [-240, 12, 240],  // 6
      [-260, 16, 160],  // 7  mountain peak section
      [-230, 18, 80],   // 8  hairpin at the summit
      [-190, 16, 20],   // 9
      [-230, 14, -40],  // 10 switchback descent
      [-260, 10, -120], // 11
      [-220, 6, -200],  // 12 frozen lake crossing
      [-160, 4, -260],  // 13
      [-80, 2, -300],   // 14 wide sweeper through woods
      [0, 0, -310],     // 15
      [60, 0, -280],    // 16
      [100, 2, -220],   // 17 chicane through village
      [80, 2, -160],    // 18
      [40, 1, -120],    // 19
      [0, 0, -100],     // 20
    ],
    lake: { x: -290, z: -180, r: 110 },
    waterLevel: -1,
    boostPadCPs: [
      { cp: 1.8, laterals: [-4, 4], stepMultiplier: [0, 0] },
      { cp: 6.5, laterals: ['racing'], stepMultiplier: [0] },
      { cp: 6.5, laterals: ['racing'], stepMultiplier: [1] },
      { cp: 11.2, laterals: [0], stepMultiplier: [0] },
      { cp: 14.5, laterals: [-5, 5], stepMultiplier: [0, 0] },
      { cp: 14.5, laterals: [0], stepMultiplier: [2] },
    ],
    ramps: [
      { cp: 8.3, halfWidth: 11, height: 2.2 },   // ski jump at summit
      { cp: 16.5, halfWidth: 8, height: 1.4 },
    ],
    itemBoxRows: [1.2, 4.5, 7.8, 10.5, 13.8, 18.0],
    itemBoxLaterals: [-8, -4, 0, 4, 8],
    theme: 'snow',
  },
];

/** Look up a track config by id. Falls back to palm_cove. */
export function getTrackConfig(id) {
  return TRACKS.find((t) => t.id === id) || TRACKS[0];
}

/** Get the list of track ids for the track selector. */
export function getTrackList() {
  return TRACKS.map((t) => ({ id: t.id, name: t.name, description: t.description, theme: t.theme }));
}
