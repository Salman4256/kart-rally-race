// Grand Prix / Cup Mode: Multi-race championship with points, round progression, and trophy celebration.
import { CHARACTERS } from './config.js';

export const GP_POINTS = [10, 8, 6, 4, 3, 2, 1, 0];

export const CUPS = [
  {
    id: 'mushroom_cup',
    name: 'MUSHROOM CUP',
    icon: '🍄',
    rounds: ['palm_cove', 'ember_canyon', 'frosted_peaks'],
  },
];

const TROPHY_STORAGE_KEY = 'tkr-gp-trophies';

export class GrandPrixManager {
  constructor() {
    this.active = false;
    this.cupId = 'mushroom_cup';
    this.currentRound = 0;       // 0, 1, 2
    this.difficulty = 'normal';
    this.laps = 3;
    this.playerCharIndex = 0;
    this.roster = [];            // [{ id, name, character, totalPoints, lastPoints, lastPlace, isPlayer }]
  }

  get cup() {
    return CUPS.find((c) => c.id === this.cupId) || CUPS[0];
  }

  get currentTrackId() {
    return this.cup.rounds[this.currentRound] || this.cup.rounds[0];
  }

  get totalRounds() {
    return this.cup.rounds.length;
  }

  get isLastRound() {
    return this.currentRound >= this.totalRounds - 1;
  }

  start({ cupId = 'mushroom_cup', difficulty = 'normal', characterIndex = 0, laps = 3 }) {
    this.active = true;
    this.cupId = cupId;
    this.difficulty = difficulty;
    this.playerCharIndex = characterIndex;
    this.laps = laps;
    this.currentRound = 0;

    // Pick 8 racers: player + 7 unique AI racers in consistent order
    const playerChar = CHARACTERS[characterIndex] || CHARACTERS[0];
    const others = CHARACTERS.filter((_, i) => i !== characterIndex);
    const chosen = [playerChar, ...others].slice(0, 8);

    this.roster = chosen.map((ch, i) => ({
      id: ch.id,
      name: ch.name,
      character: ch,
      totalPoints: 0,
      lastPoints: 0,
      lastPlace: 0,
      isPlayer: i === 0,
    }));

    return this.currentTrackId;
  }

  recordRaceResults(results = []) {
    // results is ordered by place (1st to 8th)
    results.forEach((r, i) => {
      const place = i + 1;
      const pts = GP_POINTS[i] || 0;
      const entry = this.roster.find((item) => item.id === r.character?.id || item.name === r.name);
      if (entry) {
        entry.lastPoints = pts;
        entry.lastPlace = place;
        entry.totalPoints += pts;
      }
    });

    this.roster.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.lastPlace - b.lastPlace;
    });

    return this.getStandings();
  }

  getStandings() {
    return this.roster.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  }

  advanceRound() {
    if (this.currentRound < this.totalRounds - 1) {
      this.currentRound++;
      return this.currentTrackId;
    }
    return null;
  }

  finishCup() {
    const standings = this.getStandings();
    const playerRank = standings.findIndex((s) => s.isPlayer) + 1;
    let trophy = null;
    if (playerRank === 1) trophy = 'gold';
    else if (playerRank === 2) trophy = 'silver';
    else if (playerRank === 3) trophy = 'bronze';

    if (trophy) {
      this.saveTrophy(this.cupId, this.difficulty, trophy);
    }

    this.active = false;
    return {
      standings,
      playerRank,
      trophy,
      cupName: this.cup.name,
    };
  }

  saveTrophy(cupId, diff, trophy) {
    try {
      const key = `${cupId}_${diff}`;
      const rec = JSON.parse(localStorage.getItem(TROPHY_STORAGE_KEY) || '{}');
      const rankVal = { gold: 3, silver: 2, bronze: 1 };
      const curRank = rankVal[rec[key]] || 0;
      if (rankVal[trophy] >= curRank) {
        rec[key] = trophy;
        localStorage.setItem(TROPHY_STORAGE_KEY, JSON.stringify(rec));
      }
    } catch (e) { /* ignore */ }
  }

  static getTrophies() {
    try {
      return JSON.parse(localStorage.getItem(TROPHY_STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
}
