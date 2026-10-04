export interface LyricLine {
  time: number;
  text: string;
  translation?: string;
}

function readLyrics(input: string): { lines: LyricLine[]; plain: string[] } {
  const lines: LyricLine[] = [];
  const plain: string[] = [];
  const pattern = /\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  for (const row of input.split(/\r?\n/)) {
    const timestamps = [...row.matchAll(pattern)];
    const text = row.replace(pattern, "").trim();
    if (!text) continue;
    if (timestamps.length) {
      for (const stamp of timestamps) {
        lines.push({
          time:
            Number(stamp[1]) * 60 +
            Number(stamp[2]) +
            Number(`0.${stamp[3] || "0"}`),
          text,
        });
      }
    } else if (!/^\s*\[[a-z]+:/i.test(row)) {
      plain.push(text);
    }
  }
  return { lines: lines.sort((a, b) => a.time - b.time), plain };
}

export function parseLyrics(lyric: string, translated = "") {
  const result = readLyrics(lyric);
  const translations = new Map(
    readLyrics(translated).lines.map((line) => [line.time, line.text]),
  );
  return {
    lines: result.lines.map((line) => ({
      ...line,
      translation: translations.get(line.time),
    })),
    plain: result.plain,
  };
}
