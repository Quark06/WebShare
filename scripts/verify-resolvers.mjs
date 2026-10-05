// Offline functional checks. Unknown fetches fail; public services are never contacted.
// Run with Node 24: node scripts/verify-resolvers.mjs
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalCwd = process.cwd();
const isolatedEnv = mkdtempSync(join(tmpdir(), "webshare-resolvers-"));
writeFileSync(join(isolatedEnv, ".env"), "");
// Config reads only an empty temporary .env, never the deployment's credentials.
process.chdir(isolatedEnv);
for (const key of ["BILIBILI_COOKIE", "METING_NETEASE_COOKIE", "METING_TENCENT_COOKIE", "METING_KUGOU_COOKIE", "METING_KUWO_COOKIE"]) {
  process.env[key] = "offline-test-cookie";
}
for (const key of ["BILIBILI_RESOLVER", "BILIBILI_LIVE_RESOLVER", "MUSIC_RESOLVER", "METING_API_PLATFORMS", "BILIBILIX_URL", "BILIBILIX_LIVE_URL", "METING_API_URL"]) {
  delete process.env[key];
}

const calls = [];
const fixtures = new Map();
const api = "https://resolver.example/meting/?token=fixture";
const makeApi = (server, type, id, extras = {}) => {
  const url = new URL(api);
  for (const [key, value] of Object.entries({ server, type, id, ...extras })) url.searchParams.set(key, value);
  return url.toString();
};
const song = (server, id) => ({
  name: `Track ${id}`, artist: "Fixture Artist", duration: 123,
  url: makeApi(server, "url", id),
  pic: makeApi(server, "pic", `cover-${id}`),
  lrc: makeApi(server, "lrc", id),
});
const json = (data) => () => Response.json(data);
const redirect = (url) => () => new Response(null, { status: 302, headers: { location: url } });
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  const fixture = fixtures.get(url);
  assert.ok(fixture, `Unexpected request blocked: ${url}`);
  calls.push({ url, options });
  if (new URL(url).hostname === "resolver.example") {
    assert.equal(new Headers(options.headers).get("cookie"), null, "Cookies must stay local");
    if (new URL(url).searchParams.get("type") === "url" || !new URL(url).pathname.includes("meting")) {
      assert.equal(options.redirect, "manual", "Media redirects must not be followed");
    }
  }
  return fixture();
};

try {
  const { default: config } = await import("../server/config.ts");
  const { resolveBilibili } = await import("../server/utils/bilibili.ts");
  const { createMusicClient } = await import("../server/utils/musicClient.ts");
  const { MetingApiClient } = await import("../server/utils/resolvers/metingApi.ts");
  const { getMusicTrack, getMusicPlaylist, searchMusic, resolveMusic, getMusicLyrics } = await import("../server/utils/music.ts");

  assert.equal(config.BILIBILI_RESOLVER, "local");
  assert.equal(config.BILIBILI_LIVE_RESOLVER, "local");
  assert.equal(config.MUSIC_RESOLVER, "local");
  assert.ok(!(createMusicClient("netease") instanceof MetingApiClient));
  const view = "https://api.bilibili.com/x/web-interface/view?bvid=BV1Cy4y1674D";
  const play = "https://api.bilibili.com/x/player/playurl?bvid=BV1Cy4y1674D&cid=1&qn=116&otype=json&platform=html5&high_quality=1";
  fixtures.set(view, json({ code: 0, data: { bvid: "BV1Cy4y1674D", title: "Local", pages: [{ cid: 1 }] } }));
  fixtures.set(play, json({ code: 0, data: { durl: [{ url: "https://media.example/local.mp4" }], timelength: 30000 } }));
  const local = await resolveBilibili("https://www.bilibili.com/video/BV1Cy4y1674D");
  assert.equal(local.title, "Local");
  assert.equal(local.duration, 30);
  assert.deepEqual(calls.map((call) => call.url), [view, play]);
  console.log("PASS default local metadata and playurl pipeline");

  config.BILIBILI_RESOLVER = "bilibilix";
  config.BILIBILI_LIVE_RESOLVER = "bilibilix";
  config.BILIBILIX_URL = "https://resolver.example/base/?token=fixture";
  config.BILIBILIX_LIVE_URL = "https://resolver.example/live/?token=fixture";
  const videoEndpoint = "https://resolver.example/base/video/BV1Cy4y1674D?token=fixture&p=2";
  fixtures.set(videoEndpoint, redirect("https://media.example/part2.mp4"));
  const count = calls.length;
  const videoInput = "https://www.bilibili.com/video/BV1Cy4y1674D?p=2";
  const pending = resolveBilibili(videoInput);
  assert.equal(resolveBilibili(videoInput), pending);
  const remote = await pending;
  assert.equal(remote.url, "https://media.example/part2.mp4");
  assert.equal(remote.resolver, "bilibilix");
  await resolveBilibili(videoInput);
  assert.equal(calls.length, count + 1);
  fixtures.set("https://resolver.example/live/123?token=fixture", redirect("https://media.example/live.m3u8"));
  const live = await resolveBilibili("https://live.bilibili.com/123");
  assert.equal(live.format, "hls");
  assert.equal(live.isLive, true);
  assert.equal(live.duration, 0);
  console.log("PASS Bilibilix part/base/query, MP4/live HLS, manual redirects and shared cache");

  fixtures.set("https://resolver.example/base/video/BV1Cy4y1674D?token=fixture&p=3", () => new Response("Unavailable", { status: 503 }));
  const failureCount = calls.length;
  const unavailable = "https://www.bilibili.com/video/BV1Cy4y1674D?p=3";
  await assert.rejects(resolveBilibili(unavailable), /503/);
  await assert.rejects(resolveBilibili(unavailable), /503/);
  assert.equal(calls.length, failureCount + 1);
  console.log("PASS failed Bilibili requests are cached without retries");

  config.MUSIC_RESOLVER = "meting-api";
  config.METING_API_URL = api;
  assert.ok(createMusicClient("netease") instanceof MetingApiClient);
  assert.ok(createMusicClient("tencent") instanceof MetingApiClient);
  for (const platform of ["kugou", "kuwo"]) assert.ok(!(createMusicClient(platform) instanceof MetingApiClient));
  console.log("PASS supported music provider selection and local KuGou/Kuwo fallback");

  fixtures.set(makeApi("netease", "song", "591321"), json([song("netease", "591321")]));
  fixtures.set(makeApi("netease", "url", "591321", { br: "128" }), redirect("https://media.example/song.mp3"));
  fixtures.set(makeApi("netease", "lrc", "591321"), () => new Response("[00:01.00]Fixture lyrics"));
  const input = "https://music.163.com/song?id=591321";
  const track = await getMusicTrack(input);
  assert.equal(track.url, input);
  assert.equal(track.name, "Track 591321");
  assert.equal(track.duration, 123);
  assert.equal(track.img, makeApi("netease", "pic", "cover-591321"));
  assert.match(track.channel, /Fixture Artist/);
  const musicCount = calls.length;
  const resolving = resolveMusic(input);
  assert.equal(resolveMusic(input), resolving);
  const media = await resolving;
  assert.equal(media.url, "https://media.example/song.mp3");
  assert.equal(media.bitrate, 128);
  await resolveMusic(input);
  assert.equal(calls.length, musicCount + 1);
  assert.deepEqual(await getMusicLyrics(input), { lyric: "[00:01.00]Fixture lyrics", tlyric: "" });
  console.log("PASS APlayer metadata/id, cached endpoints, 128 bitrate, shared resolve and text lyrics");

  fixtures.set(makeApi("netease", "search", "fixture", { page: "1", limit: "10" }), json([song("netease", "101"), song("netease", "102")]));
  const searchResults = await searchMusic("netease", "fixture");
  const searchedCount = calls.length;
  for (const result of searchResults) assert.equal(await getMusicTrack(result.url), result);
  assert.equal(calls.length, searchedCount);
  fixtures.set(makeApi("netease", "playlist", "123"), json([song("netease", "201"), song("netease", "202")]));
  const playlist = await getMusicPlaylist("https://music.163.com/playlist?id=123");
  const playlistCount = calls.length;
  for (const result of playlist) assert.equal(await getMusicTrack(result.url), result);
  assert.equal(calls.length, playlistCount);
  console.log("PASS search/playlist metadata reuse without per-song requests");

  fixtures.set(makeApi("tencent", "song", "QQfixture"), json([song("tencent", "QQfixture")]));
  fixtures.set(makeApi("tencent", "url", "QQfixture", { br: "128" }), redirect("https://media.example/qq.m4a"));
  fixtures.set(makeApi("tencent", "lrc", "QQfixture"), () => new Response("[00:02.00]QQ fixture"));
  const qq = "https://y.qq.com/n/ryqq/songDetail/QQfixture";
  assert.equal((await resolveMusic(qq)).url, "https://media.example/qq.m4a");
  assert.equal((await getMusicLyrics(qq)).lyric, "[00:02.00]QQ fixture");
  fixtures.set(makeApi("netease", "song", "404"), () => new Response("Unavailable", { status: 503 }));
  const failedMusicCount = calls.length;
  await assert.rejects(getMusicTrack("https://music.163.com/song?id=404"), /503/);
  await assert.rejects(getMusicTrack("https://music.163.com/song?id=404"), /503/);
  assert.equal(calls.length, failedMusicCount + 1);
  console.log("PASS QQ protocol and failed music request cache");
  console.log(`All offline functional checks passed (${calls.length} fixture requests, zero network requests).`);
} finally {
  process.chdir(originalCwd);
  rmSync(isolatedEnv, { recursive: true, force: true });
}
