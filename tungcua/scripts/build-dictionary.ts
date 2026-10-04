#!/usr/bin/env ts-node
/**
 * Build-time dictionary builder.
 * Reads CC-CEDICT, Unihan, CVDict sources and writes assets/dictionary.sqlite
 * with CharEntry schema (indexes on char, radical, pinyin).
 *
 * Usage: pnpm run build:dictionary
 * Run this before building the app for P1+.
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(PROJECT_ROOT, 'assets', 'dictionary.sqlite');

// CharEntry schema
interface CharEntry {
  char: string;
  pinyin: string;
  hanviet: string;
  en_gloss: string;
  vi_gloss: string;
  radical: string;
  radical_number: number;
  strokes: number;
  hsk: number | null;
  frequency: number;
  decomposition: string;
  trad_variant: string | null;
  simp_variant: string | null;
}

// Create database and tables
function createDatabase(dbPath: string) {
  // Remove existing file
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Create tables
  sqlite.exec(`
    CREATE TABLE char_entries (
      char TEXT PRIMARY KEY NOT NULL,
      pinyin TEXT NOT NULL,
      hanviet TEXT NOT NULL,
      en_gloss TEXT NOT NULL,
      vi_gloss TEXT NOT NULL,
      radical TEXT NOT NULL,
      radical_number INTEGER NOT NULL,
      strokes INTEGER NOT NULL,
      hsk INTEGER,
      frequency INTEGER NOT NULL,
      decomposition TEXT NOT NULL,
      trad_variant TEXT,
      simp_variant TEXT
    );

    CREATE INDEX idx_char_entries_radical ON char_entries(radical);
    CREATE INDEX idx_char_entries_pinyin ON char_entries(pinyin);
    CREATE INDEX idx_char_entries_strokes ON char_entries(strokes);
    CREATE INDEX idx_char_entries_hsk ON char_entries(hsk);
    CREATE INDEX idx_char_entries_frequency ON char_entries(frequency);

    CREATE TABLE bookmarks (
      id TEXT PRIMARY KEY NOT NULL,
      char TEXT NOT NULL REFERENCES char_entries(char),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE lookup_history (
      id TEXT PRIMARY KEY NOT NULL,
      char TEXT NOT NULL REFERENCES char_entries(char),
      created_at INTEGER NOT NULL
    );
  `);

  return db;
}

// Parse CC-CEDICT format
function parseCCCEDICT(content: string): Map<string, Partial<CharEntry>> {
  const entries = new Map<string, Partial<CharEntry>>();
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;

    // Format: traditional simplified [pinyin] /glosses/
    const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.*)\/\s*$/);
    if (!match) continue;

    const [, trad, simp, pinyin, glosses] = match;
    const char = trad !== simp ? trad : simp; // Use traditional as primary key

    if (!entries.has(char)) {
      entries.set(char, {
        trad_variant: trad !== simp ? trad : null,
        simp_variant: trad !== simp ? simp : null,
        pinyin: pinyin,
        en_gloss: glosses.replace(/\/\s*$/g, ''),
      });
    }
  }

  return entries;
}

// Parse Unihan kVietnamese (Han-Viet readings)
function parseUnihanVietnamese(content: string): Map<string, string> {
  const readings = new Map<string, string>();
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length >= 3 && parts[1] === 'kVietnamese') {
      const charCode = parseInt(parts[0].replace('U+', ''), 16);
      const char = String.fromCodePoint(charCode);
      readings.set(char, parts[2]);
    }
  }

  return readings;
}

// Parse Unihan kRadical
function parseUnihanRadical(content: string): Map<string, { radical: string; number: number }> {
  const radicals = new Map<string, { radical: string; number: number }>();
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length >= 3 && parts[1] === 'kRSUnicode') {
      const charCode = parseInt(parts[0].replace('U+', ''), 16);
      const char = String.fromCodePoint(charCode);
      // Format: "radical_number'stroke_count"
      const radicalInfo = parts[2].split("'");
      if (radicalInfo.length >= 2) {
        const radicalNumber = parseInt(radicalInfo[0], 10);
        // We'd need a mapping from radical number to radical character
        // For now, store the number
        radicals.set(char, { radical: '', number: radicalNumber });
      }
    }
  }

  return radicals;
}

// Main build function
async function buildDictionary() {
  console.log('Building dictionary...');

  // Check if source files exist
  const sourcesDir = path.join(PROJECT_ROOT, 'scripts', 'sources');
  const ccedictPath = path.join(sourcesDir, 'cedict_ts.u8');
  const unihanVietPath = path.join(sourcesDir, 'Unihan_Vietnamese.txt');
  const unihanRadicalPath = path.join(sourcesDir, 'Unihan_RadicalStrokeCounts.txt');

  if (!fs.existsSync(ccedictPath)) {
    console.warn('CC-CEDICT source not found at:', ccedictPath);
    console.warn('Create placeholder database for P0...');
    createPlaceholderDatabase();
    return;
  }

  // Parse sources
  console.log('Parsing CC-CEDICT...');
  const ccedict = parseCCCEDICT(fs.readFileSync(ccedictPath, 'utf-8'));

  console.log('Parsing Unihan Vietnamese...');
  const vietReadings = parseUnihanVietnamese(fs.readFileSync(unihanVietPath, 'utf-8'));

  console.log('Parsing Unihan Radicals...');
  const radicalData = parseUnihanRadical(fs.readFileSync(unihanRadicalPath, 'utf-8'));

  // Merge and build entries
  console.log('Building entries...');
  const db = createDatabase(OUTPUT_PATH);
  let count = 0;

  for (const [char, data] of ccedict.entries()) {
    const viet = vietReadings.get(char) || '';
    const radical = radicalData.get(char) || { radical: '', number: 0 };

    const entry: CharEntry = {
      char,
      pinyin: data.pinyin || '',
      hanviet: viet,
      en_gloss: data.en_gloss || '',
      vi_gloss: '⧗ untranslated', // Placeholder per constitution
      radical: radical.radical,
      radical_number: radical.number,
      strokes: 0, // Would need kTotalStrokes
      hsk: null,
      frequency: 0,
      decomposition: '',
      trad_variant: data.trad_variant || null,
      simp_variant: data.simp_variant || null,
    };

    // Insert into database
    db.run(
      `INSERT INTO char_entries (char, pinyin, hanviet, en_gloss, vi_gloss, radical, radical_number, strokes, hsk, frequency, decomposition, trad_variant, simp_variant)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.char, entry.pinyin, entry.hanviet, entry.en_gloss, entry.vi_gloss,
        entry.radical, entry.radical_number, entry.strokes, entry.hsk, entry.frequency,
        entry.decomposition, entry.trad_variant, entry.simp_variant
      ]
    );
    count++;
  }

  console.log(`Built dictionary with ${count} entries at ${OUTPUT_PATH}`);
}

function createPlaceholderDatabase() {
  console.log('Creating placeholder dictionary for P0...');
  const db = createDatabase(OUTPUT_PATH);
  console.log(`Created placeholder database at ${OUTPUT_PATH}`);
}

// Run
buildDictionary().catch(console.error);