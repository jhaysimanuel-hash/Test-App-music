import { SongSection, ParsedLine } from '../types';
import { stripChords, transposeChord } from './chordTransposer';

export const transposeKey = transposeChord;

const SECTION_HEADER_REGEX = /^\[\s*(Intro|Verse\s*\d*|Chorus\s*\d*|Pre-Chorus\s*\d*|Bridge\s*\d*|Tag\s*\d*|Instrumental\s*\d*|Outro|Interlude\s*\d*|Ending)\s*\]/i;

/**
 * Determine section type from header label
 */
function getSectionType(label: string): SongSection['type'] {
  const lower = label.toLowerCase();
  if (lower.includes('intro')) return 'intro';
  if (lower.includes('pre-chorus')) return 'pre-chorus';
  if (lower.includes('chorus')) return 'chorus';
  if (lower.includes('bridge')) return 'bridge';
  if (lower.includes('tag')) return 'tag';
  if (lower.includes('instrumental') || lower.includes('interlude')) return 'instrumental';
  if (lower.includes('outro') || lower.includes('ending')) return 'outro';
  return 'verse';
}

/**
 * Parses a single line containing bracketed chords into tokens and aligned lines
 * E.g. "[G]Amazing [D]grace how [Em]sweet the [C]sound"
 */
export function parseLineWithChords(line: string): ParsedLine {
  const tokens: Array<{ chord?: string; text: string }> = [];
  const regex = /\[([A-G](?:[#b]|m|maj|dim|aug|sus|add|\d)*)\]/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  let chordsLineBuilder = '';
  let lyricsLineBuilder = '';

  // Check if line has any chords
  if (!line.includes('[')) {
    return {
      lyricsLine: line,
      tokens: [{ text: line }]
    };
  }

  while ((match = regex.exec(line)) !== null) {
    const chord = match[1];
    const matchStart = match.index;

    // Any text before this chord
    if (matchStart > lastIndex) {
      const textBefore = line.substring(lastIndex, matchStart);
      tokens.push({ text: textBefore });
      lyricsLineBuilder += textBefore;
      chordsLineBuilder = chordsLineBuilder.padEnd(lyricsLineBuilder.length - textBefore.length, ' ');
    }

    // Next we look ahead for text immediately following this chord until next chord or end of line
    const afterChordIndex = regex.lastIndex;
    const nextBracket = line.indexOf('[', afterChordIndex);
    const textChunk = nextBracket === -1 ? line.substring(afterChordIndex) : line.substring(afterChordIndex, nextBracket);

    tokens.push({ chord, text: textChunk });
    lyricsLineBuilder += textChunk;

    // Align chord in monospace chordsLine
    const chordStartPos = lyricsLineBuilder.length - textChunk.length;
    if (chordsLineBuilder.length < chordStartPos) {
      chordsLineBuilder = chordsLineBuilder.padEnd(chordStartPos, ' ');
    }
    chordsLineBuilder += chord;
    lastIndex = afterChordIndex + textChunk.length;
    regex.lastIndex = lastIndex;
  }

  return {
    chordsLine: chordsLineBuilder,
    lyricsLine: lyricsLineBuilder || line,
    tokens
  };
}

/**
 * Parses a full song string into structured sections
 */
export function parseSongLyrics(rawText: string): SongSection[] {
  if (!rawText || !rawText.trim()) return [];

  // Robustly identify headers by looking for [Section Name] at the start of a line.
  // We use a more strict lookahead to ensure it's not a chord (e.g. [G]).
  // Chords are always at the start of a token and don't match our section keywords.
  const SECTION_HEADER_REGEX = /^\[\s*(Intro|Verse\s*\d*|Chorus\s*\d*|Pre-Chorus\s*\d*|Bridge\s*\d*|Tag\s*\d*|Instrumental\s*\d*|Outro|Interlude\s*\d*|Ending)\s*\]/i;

  const lines = rawText.split(/\r?\n/);
  const sections: SongSection[] = [];

  let currentLabel = 'Verse 1';
  let currentLines: ParsedLine[] = [];
  let sectionIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip truly blank lines

    // Check if line is a section header. 
    // We explicitly check if it matches our header pattern.
    const headerMatch = line.match(SECTION_HEADER_REGEX);
    if (headerMatch) {
      // If we have accumulated lines, push previous section
      if (currentLines.length > 0) {
        sections.push({
          id: `section-${sectionIndex++}`,
          label: currentLabel,
          type: getSectionType(currentLabel),
          lines: currentLines,
          plainLyrics: currentLines.map(l => l.lyricsLine).filter(Boolean).join('\n')
        });
        currentLines = [];
      }
      currentLabel = headerMatch[1].trim();
      continue;
    }

    // Not a header, treat as lyrics/chord line
    currentLines.push(parseLineWithChords(line));
  }

  // Push final section
  if (currentLines.length > 0) {
    sections.push({
      id: `section-${sectionIndex++}`,
      label: currentLabel,
      type: getSectionType(currentLabel),
      lines: currentLines,
      plainLyrics: currentLines.map(l => l.lyricsLine).filter(Boolean).join('\n')
    });
  }

  // Fallback
  if (sections.length === 0 && rawText.trim()) {
    sections.push({
      id: 'section-1',
      label: 'Verse 1',
      type: 'verse',
      lines: lines.filter(Boolean).map(l => parseLineWithChords(l)),
      plainLyrics: stripChords(rawText)
    });
  }

  return sections;
}
