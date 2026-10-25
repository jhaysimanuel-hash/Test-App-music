/**
 * Musical Chord Transposition Engine
 * Supports standard chord suffixes (m, maj7, sus4, add9, dim7, etc.) and bass slash chords (/G, /B)
 */

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_KEYS = [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

export const PRIMARY_KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'
];

// Mapping to note index (0-11)
const NOTE_MAP: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'DB': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'EB': 3, 'Eb': 3,
  'E': 4, 'FB': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'GB': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'AB': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'BB': 10, 'Bb': 10,
  'B': 11, 'CB': 11, 'Cb': 11
};

// Keys that naturally use flats in standard church hymnals and lead sheets
const FLAT_KEYS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm']);

/**
 * Calculate semitone distance between two keys
 */
export function getSemitoneDistance(fromKey: string, toKey: string): number {
  const cleanFrom = fromKey.replace(/m$/, '');
  const cleanTo = toKey.replace(/m$/, '');

  const fromIdx = NOTE_MAP[cleanFrom];
  const toIdx = NOTE_MAP[cleanTo];

  if (fromIdx === undefined || toIdx === undefined) return 0;
  let dist = (toIdx - fromIdx) % 12;
  if (dist < 0) dist += 12;
  return dist;
}

/**
 * Transpose a single note root by semitones
 */
export function transposeNote(note: string, semitones: number, targetKey?: string): string {
  const cleanNote = note.trim();
  const index = NOTE_MAP[cleanNote];
  if (index === undefined) return note;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  const preferFlats = targetKey ? FLAT_KEYS.has(targetKey) : false;
  return preferFlats ? CHROMATIC_FLATS[newIndex] : CHROMATIC_SHARPS[newIndex];
}

/**
 * Transpose a single chord string (e.g. "G#m7/B", "Cadd9", "F#sus4")
 */
export function transposeChord(chord: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return chord;

  // Match root, optional accidental, quality/extensions, and optional slash bass
  const match = chord.match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
  if (!match) return chord;

  const [, root, quality, slashBass] = match;
  const newRoot = transposeNote(root, semitones, targetKey);
  const newSlashBass = slashBass ? `/${transposeNote(slashBass, semitones, targetKey)}` : '';

  return `${newRoot}${quality}${newSlashBass}`;
}

/**
 * Transpose all chords enclosed in brackets within a text
 * Example: "[G]Amazing [D/F#]grace" -> "[A]Amazing [E/G#]grace"
 */
export function transposeLyricsWithChords(text: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return text;

  // Skip section headers like [Chorus] or [Verse 1]
  const SECTION_KEYWORDS = ['intro', 'verse', 'chorus', 'pre-chorus', 'bridge', 'tag', 'instrumental', 'outro', 'interlude', 'ending'];
  
  return text.replace(/\[([^\]]+)\]/gi, (match, content) => {
    const cleanContent = content.trim();
    const lowerContent = cleanContent.toLowerCase();
    
    // Check if it's a section header
    const isSectionHeader = SECTION_KEYWORDS.some(k => lowerContent.startsWith(k));
    if (isSectionHeader) return match;

    // Check if it's a chord. Chords usually start with A-G.
    // If it doesn't look like a chord, don't transpose it.
    if (!/^[A-G]/i.test(cleanContent)) return match;

    const transposed = transposeChord(cleanContent, semitones, targetKey);
    return `[${transposed}]`;
  });
}

/**
 * Strip all chord tags to produce clean lyrics for vocalists and projectors
 */
export function stripChords(text: string): string {
  return text.replace(/\[[^\]]*\]/g, '').replace(/[ \t]+/g, ' ');
}

/**
 * Helper to compute Capo position:
 * If targetKey is wanted, but guitarist wants to play in preferredShape (e.g. Key D using C shapes -> Capo 2)
 */
export function calculateCapo(targetKey: string, guitarShape: string): { fret: number; message: string } {
  const dist = getSemitoneDistance(guitarShape, targetKey);
  return {
    fret: dist,
    message: dist === 0 
      ? 'No Capo needed (Open)' 
      : `Capo on Fret ${dist} (Play ${guitarShape} shapes)`
  };
}

export const transposeKey = transposeChord;
