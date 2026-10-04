export const musicPlatforms = ["netease", "tencent", "kugou", "kuwo"] as const;
export type MusicPlatform = (typeof musicPlatforms)[number];
export const musicPlatformNames: Record<MusicPlatform, string> = {
  netease: "NetEase Music",
  tencent: "QQ Music",
  kugou: "KuGou",
  kuwo: "Kuwo",
};

export interface MusicReference {
  platform: MusicPlatform;
  id: string;
  kind: "song" | "playlist";
}

export function getMusicReference(input: string): MusicReference | null {
  try {
    let url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (["music.163.com", "y.music.163.com"].includes(url.hostname)) {
      if (url.hash.startsWith("#/"))
        url = new URL(url.hash.slice(1), url.origin);
      const kind = url.pathname.match(/^\/(?:m\/)?(song|playlist)\/?$/)?.[1];
      const id = url.searchParams.get("id");
      if (kind && id && /^\d+$/.test(id)) {
        return { platform: "netease", id, kind: kind as "song" | "playlist" };
      }
    }
    if (["y.qq.com", "www.y.qq.com"].includes(url.hostname)) {
      const song =
        url.pathname.match(
          /\/(?:songDetail\/|song\/)([a-zA-Z0-9]+)(?:\.html)?\/?$/,
        )?.[1] || url.searchParams.get("songmid");
      if (song && /^[a-zA-Z0-9]+$/.test(song)) {
        return { platform: "tencent", id: song, kind: "song" };
      }
      const playlist =
        url.pathname.match(/\/playlist\/(\d+)\/?$/)?.[1] ||
        url.searchParams.get("disstid");
      if (playlist && /^\d+$/.test(playlist)) {
        return { platform: "tencent", id: playlist, kind: "playlist" };
      }
    }
    if (["kugou.com", "www.kugou.com", "m.kugou.com"].includes(url.hostname)) {
      const hash =
        url.searchParams.get("hash") ||
        new URLSearchParams(url.hash.slice(1)).get("hash");
      if (hash && /^[a-fA-F0-9]{32}$/.test(hash)) {
        return { platform: "kugou", id: hash.toLowerCase(), kind: "song" };
      }
      const playlist = url.pathname.match(
        /\/special\/single\/(\d+)\.html$/,
      )?.[1];
      if (playlist)
        return { platform: "kugou", id: playlist, kind: "playlist" };
    }
    if (["kuwo.cn", "www.kuwo.cn"].includes(url.hostname)) {
      const match = url.pathname.match(
        /^\/(play_detail|playlist_detail)\/(\d+)\/?$/,
      );
      if (match)
        return {
          platform: "kuwo",
          id: match[2],
          kind: match[1] === "play_detail" ? "song" : "playlist",
        };
    }
  } catch {
    // Ordinary file URLs and non-music inputs keep their existing behavior.
  }
  return null;
}

export const isMusic = (input: string) =>
  getMusicReference(input)?.kind === "song";

export function musicSongUrl(platform: MusicPlatform, id: string): string {
  if (platform === "netease") return `https://music.163.com/song?id=${id}`;
  if (platform === "tencent") return `https://y.qq.com/n/ryqq/songDetail/${id}`;
  if (platform === "kugou") return `https://www.kugou.com/song/#hash=${id}`;
  return `https://www.kuwo.cn/play_detail/${id}`;
}
