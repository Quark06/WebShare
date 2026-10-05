import { createMusicClient, type MusicClient } from "./musicClient.ts";
import {
  getMusicReference,
  musicPlatforms,
  musicPlatformNames,
  musicSongUrl,
  type MusicPlatform,
} from "../../src/utils/music.ts";

interface MetingSong {
  id: string | number;
  name: string;
  artist: string[];
  album?: string;
  pic_id?: string | number;
  url_id?: string | number;
}

const cache = new Map<string, { expires: number; result: Promise<unknown> }>();

function cached<T>(
  key: string,
  work: () => Promise<T>,
  ttl = 5 * 60 * 1000,
): Promise<T> {
  const now = Date.now();
  for (const [id, entry] of cache) if (entry.expires <= now) cache.delete(id);
  const entry = cache.get(key);
  if (entry) return entry.result as Promise<T>;
  const result = work();
  cache.set(key, { expires: now + ttl, result });
  void result.catch(() => {
    const current = cache.get(key);
    if (current?.result === result) current.expires = Date.now() + 30000;
  });
  return result;
}

export function parseMusicPlatform(input: unknown): MusicPlatform {
  if (!musicPlatforms.includes(input as MusicPlatform))
    throw new Error("Choose a supported music platform.");
  return input as MusicPlatform;
}

const client = createMusicClient;

function json(meting: MusicClient, text: string): any {
  if (meting.error)
    throw new Error("The music platform could not be reached. Try again later.");
  if (meting.info?.statusCode !== 200)
    throw new Error(
      `Music API returned HTTP ${meting.info?.statusCode || "error"}.`,
    );
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The music platform returned an invalid response.");
  }
}

function songs(meting: MusicClient, text: string): MetingSong[] {
  const data = json(meting, text);
  const items = Array.isArray(data)
    ? data.filter((song) => song?.id && song?.name)
    : [];
  if (!Array.isArray(data) || (data.length && !items.length)) {
    throw new Error(
      "Music search or metadata is unavailable for this platform. Check its Cookie configuration.",
    );
  }
  return items;
}

function rawSongs(meting: MusicClient): any[] {
  try {
    const data = JSON.parse(meting.raw || "{}");
    const candidates = [
      data.songs,
      data.result?.songs,
      data.playlist?.tracks,
      data.data?.song?.list,
      data.data?.cdlist?.[0]?.songlist,
      data.data?.info,
      data.data?.list,
      data.data?.musicList,
      data.data,
    ];
    return candidates.find(Array.isArray) || (data.data ? [data.data] : []);
  } catch {
    return [];
  }
}

function asTrack(
  platform: MusicPlatform,
  song: MetingSong,
  raw: any = {},
): PlaylistVideo {
  raw = raw.musicData || raw;
  let duration = Number(
    raw.dt || raw.duration || raw.interval || raw.timelength || 0,
  );
  if (raw.dt || raw.timelength) duration /= 1000;
  const albumMid = raw.albummid || raw.album?.mid;
  const img =
    raw.al?.picUrl ||
    raw.album?.picUrl ||
    raw.pic ||
    raw.imgurl ||
    (albumMid
      ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albumMid}.jpg`
      : undefined);
  return {
    url: musicSongUrl(platform, String(song.id)),
    name: song.name,
    channel: `${(song.artist || []).join(", ")} · ${musicPlatformNames[platform]}`,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 0,
    img: typeof img === "string" ? img : undefined,
    type: "music",
  };
}

function trackResults(
  platform: MusicPlatform,
  tracks: MetingSong[],
  raw: any[],
): PlaylistVideo[] {
  return tracks.map((song, index) => {
    const track = asTrack(platform, song, raw[index]);
    // Queue additions reuse imported/search metadata, without one API request per song.
    const id = platform === "kugou" ? String(song.id).toLowerCase() : song.id;
    cache.set(`song:${platform}:${id}`, {
      expires: Date.now() + 5 * 60 * 1000,
      result: Promise.resolve(track),
    });
    return track;
  });
}

export function searchMusic(
  platform: MusicPlatform,
  query: string,
): Promise<PlaylistVideo[]> {
  const keyword = query.trim();
  if (!keyword || keyword.length > 200)
    throw new Error("Enter a music search term of up to 200 characters.");
  return cached(
    `search:${platform}:${keyword}`,
    async () => {
      const meting = client(platform);
      const tracks = songs(
        meting,
        await meting.search(keyword, { page: 1, limit: 10 }),
      );
      const raw = rawSongs(meting);
      return trackResults(platform, tracks, raw);
    },
    60000,
  );
}

export function getMusicTrack(input: string): Promise<PlaylistVideo> {
  const ref = getMusicReference(input);
  if (!ref || ref.kind !== "song")
    throw new Error("Enter a supported music song link.");
  return cached(`song:${ref.platform}:${ref.id}`, async () => {
    const meting = client(ref.platform);
    const song = songs(meting, await meting.song(ref.id))[0];
    if (!song) throw new Error("This song is unavailable.");
    return asTrack(ref.platform, song, rawSongs(meting)[0]);
  });
}

export function getMusicPlaylist(input: string): Promise<PlaylistVideo[]> {
  const ref = getMusicReference(input);
  if (!ref || ref.kind !== "playlist")
    throw new Error("Enter a supported music playlist link.");
  return cached(`playlist:${ref.platform}:${ref.id}`, async () => {
    const meting = client(ref.platform);
    const tracks = songs(meting, await meting.playlist(ref.id));
    const raw = rawSongs(meting);
    return trackResults(ref.platform, tracks, raw);
  });
}

export function getMusicLyrics(
  input: string,
): Promise<{ lyric: string; tlyric: string }> {
  const ref = getMusicReference(input);
  if (!ref || ref.kind !== "song")
    throw new Error("Enter a supported music song link.");
  return cached(
    `lyrics:${ref.platform}:${ref.id}`,
    async () => {
      const meting = client(ref.platform);
      const data = json(meting, await meting.lyric(ref.id));
      return {
        lyric: typeof data.lyric === "string" ? data.lyric : "",
        tlyric: typeof data.tlyric === "string" ? data.tlyric : "",
      };
    },
    30 * 60 * 1000,
  );
}

export function resolveMusic(
  input: string,
): Promise<PlaylistVideo & { bitrate: number }> {
  const ref = getMusicReference(input);
  if (!ref || ref.kind !== "song")
    throw new Error("Enter a supported music song link.");
  return cached(`play:${ref.platform}:${ref.id}`, async () => {
    const track = await getMusicTrack(input);
    const meting = client(ref.platform);
    const source = json(meting, await meting.url(ref.id, 128));
    if (!source.url) {
      throw new Error(
        "No playable source is available. Check the song availability and this platform's server Cookie configuration.",
      );
    }
    let url: URL;
    try {
      url = new URL(source.url);
    } catch {
      throw new Error("The music platform returned an invalid media URL.");
    }
    if (!["http:", "https:"].includes(url.protocol))
      throw new Error("The music platform returned an invalid media URL.");
    // Meting returns HTTP URLs for these CDNs even when HTTPS is available.
    if (
      url.protocol === "http:" &&
      ["music.126.net", "qq.com", "kugou.com", "kuwo.cn"].some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    ) {
      url.protocol = "https:";
    }
    return { ...track, url: url.toString(), bitrate: Number(source.br) || 0 };
  });
}
