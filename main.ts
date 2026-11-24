// One Emoji, One Smile — entry for make.fun competition
// u-0xkianno-one-emoji-one-smile-5470751f.
//
// The whole entry is a single emoji: the one most likely to make a
// stranger smile. Mine is the sunflower:
//
//     🌻
//
// It is warm at first glance with no context needed, it reads the same
// for a stranger of any age or background, it carries no intimacy or
// flirtation that would land oddly from someone unknown, and it feels
// picked for the moment rather than being the first default smiley
// that comes to mind. This program writes that emoji to entry.txt in
// the output directory (MAKEFUN_OUTPUT_DIR when set, otherwise
// /output) and then checks the written file against the competition
// gate exactly as published — UTF-8 text of 1 to 8 characters, not
// only white space — plus the brief's demand of exactly one emoji.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const EMOJI = "🌻";
const GATE_MIN = 1;
const GATE_MAX = 8;

function refuse(reason: string): never {
  console.error(`emoji-smile gate check failed: ${reason}`);
  process.exit(1);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const target = join(outDir, "entry.txt");
writeFileSync(target, EMOJI, "utf8");

// Verification stage (my own addition): re-read the file from disk and
// hold it to the gate, so a mangled write fails loudly here instead of
// scoring as an invalid entry later.
const onDisk = readFileSync(target, "utf8");
const codePoints = [...onDisk];
if (codePoints.length < GATE_MIN || codePoints.length > GATE_MAX) {
  refuse(`character count ${codePoints.length} is outside ${GATE_MIN}-${GATE_MAX}`);
}
if (onDisk.trim().length === 0) refuse("the file is only white space");
if (onDisk !== EMOJI) refuse("the file on disk is not the emoji that was meant to be sent");
// Exactly one emoji: segment the text into grapheme clusters the way a
// phone screen would show them, and demand a single cluster.
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const clusters = [...segmenter.segment(onDisk)];
if (clusters.length !== 1) refuse(`expected exactly one grapheme cluster, found ${clusters.length}`);
// And that cluster must be a pictograph, not a letter, digit or mark.
if (!/\p{Extended_Pictographic}/u.test(onDisk)) refuse("the single character is not an emoji");
if (/[\p{L}\p{N}]/u.test(onDisk)) refuse("the entry contains a letter or digit");
// Byte-level belt and braces: the sunflower is one code point
// (U+1F33B), which is exactly four UTF-8 bytes and nothing else — no
// variation selector quietly turning it into a different presentation,
// no byte-order mark, no trailing newline.
const rawBytes = readFileSync(target);
if (!rawBytes.equals(Buffer.from(EMOJI, "utf8"))) {
  refuse(`file holds ${rawBytes.length} bytes, not the emoji's exact ${Buffer.byteLength(EMOJI)}`);
}
if (codePoints[0].codePointAt(0) !== 0x1f33b) refuse("the code point is not the sunflower");
if (onDisk.includes("\uFE0F") || onDisk.includes("\u200D")) {
  refuse("the emoji carries a variation selector or joiner, so it is not the plain sunflower");
}

console.log(`wrote ${target}: "${onDisk}" (${codePoints.length} code point, one grapheme, gate ok)`);
