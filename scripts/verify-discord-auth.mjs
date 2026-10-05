// Offline checks for the Discord login gate. Unknown fetches fail; Discord is never contacted.
// Run with Node 24: node scripts/verify-discord-auth.mjs
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalCwd = process.cwd();
const realNow = Date.now;
const isolatedEnv = mkdtempSync(join(tmpdir(), "webshare-discord-auth-"));
writeFileSync(join(isolatedEnv, ".env"), "");
// Config reads only an empty temporary .env, never the deployment's credentials.
process.chdir(isolatedEnv);
process.env.DISCORD_AUTH_CLIENT_ID = "client-fixture";
process.env.DISCORD_AUTH_CLIENT_SECRET = "secret-fixture";
process.env.DISCORD_AUTH_GUILD_ID = "111, 222";
for (const key of ["DISCORD_AUTH_REDIRECT_URI", "DISCORD_AUTH_SESSION_DAYS"]) {
  delete process.env[key];
}

const api = "https://discord.com/api/v10";
const calls = [];
const fixtures = new Map();
globalThis.fetch = async (input, options = {}) => {
  const url = String(input);
  const fixture = fixtures.get(url);
  assert.ok(fixture, `Unexpected request blocked: ${url}`);
  calls.push({ url, options });
  return fixture(options);
};
const json = (data, status = 200) => () => Response.json(data, { status });
const cookieValue = (setCookie) => setCookie.split(";")[0].split("=")[1];
const day = 24 * 60 * 60 * 1000;

try {
  const { default: config } = await import("../server/config.ts");
  const auth = await import("../server/utils/discordAuth.ts");

  assert.equal(auth.isDiscordAuthEnabled(), true);
  for (const key of ["DISCORD_AUTH_CLIENT_ID", "DISCORD_AUTH_CLIENT_SECRET", "DISCORD_AUTH_GUILD_ID"]) {
    const value = config[key];
    config[key] = "";
    assert.equal(auth.isDiscordAuthEnabled(), false, `${key} is required`);
    config[key] = value;
  }
  config.DISCORD_AUTH_GUILD_ID = "not-a-server-id";
  assert.equal(auth.isDiscordAuthEnabled(), false);
  config.DISCORD_AUTH_GUILD_ID = "111, 222";
  console.log("PASS gate stays off unless client ID, secret and a server ID are set");

  const user = { id: "42", name: "Fixture", avatarUrl: "https://cdn.discordapp.com/avatars/42/a.png?size=128" };
  assert.match(auth.sessionCookie(user, true), /^webshare_session=[^;]+; Max-Age=2592000; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
  assert.doesNotMatch(auth.sessionCookie(user, false), /Secure/);
  const token = cookieValue(auth.sessionCookie(user, true));
  assert.deepEqual(auth.readDiscordSession(`other=1; webshare_session=${token}`), user);
  const [body, signature] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url")), id: "43" })).toString("base64url");
  assert.equal(auth.readDiscordSession(`webshare_session=${forged}.${signature}`), undefined);
  assert.equal(auth.readDiscordSession(`webshare_session=${body}.${signature.slice(0, -2)}`), undefined);
  assert.equal(auth.readDiscordSession(`webshare_session=${body}`), undefined);
  assert.equal(auth.readDiscordSession(undefined), undefined);
  const state = cookieValue(auth.stateCookie("abc", "/watch/room", false));
  assert.equal(auth.readDiscordSession(`webshare_session=${state}`), undefined);
  assert.deepEqual(auth.readDiscordState(`webshare_discord_state=${state}`), { state: "abc", returnTo: "/watch/room" });
  assert.equal(auth.readDiscordState(`webshare_discord_state=${token}`), undefined);
  config.DISCORD_AUTH_CLIENT_SECRET = "rotated-secret";
  assert.equal(auth.readDiscordSession(`webshare_session=${token}`), undefined);
  config.DISCORD_AUTH_CLIENT_SECRET = "secret-fixture";
  console.log("PASS signed sessions reject tampering, truncation, state replay and other secrets");

  Date.now = () => realNow() + 29 * day;
  assert.deepEqual(auth.readDiscordSession(`webshare_session=${token}`), user);
  Date.now = () => realNow() + 31 * day;
  assert.equal(auth.readDiscordSession(`webshare_session=${token}`), undefined);
  Date.now = realNow;
  config.DISCORD_AUTH_SESSION_DAYS = "7";
  assert.match(auth.sessionCookie(user, false), /Max-Age=604800;/);
  config.DISCORD_AUTH_SESSION_DAYS = 30;
  console.log("PASS sessions last a fixed 30 days (configurable) from login");

  for (const input of ["//evil.example", "https://evil.example", "/\\evil.example", "/\t/evil.example", "/.//evil.example", "watch", undefined, ["/watch"]]) {
    assert.equal(auth.safeReturnTo(input), "/", `rejects ${JSON.stringify(input)}`);
  }
  assert.equal(auth.safeReturnTo("/watch/room?x=1#t"), "/watch/room?x=1#t");
  console.log("PASS return paths stay on this site");

  const redirectUri = "https://watch.example/auth/discord/callback";
  assert.equal(auth.discordRedirectUri("https", "watch.example"), redirectUri);
  config.DISCORD_AUTH_REDIRECT_URI = "https://api.example/auth/discord/callback";
  assert.equal(auth.discordRedirectUri("http", "localhost:8080"), "https://api.example/auth/discord/callback");
  config.DISCORD_AUTH_REDIRECT_URI = "";
  const authorize = new URL(auth.discordAuthorizeUrl("abc", redirectUri));
  assert.equal(authorize.origin + authorize.pathname, "https://discord.com/oauth2/authorize");
  assert.deepEqual(Object.fromEntries(authorize.searchParams), {
    response_type: "code",
    client_id: "client-fixture",
    scope: "identify guilds.members.read",
    redirect_uri: redirectUri,
    state: "abc",
    prompt: "none",
  });
  console.log("PASS authorize URL requests identify and guilds.members.read without re-prompting");

  fixtures.set(`${api}/oauth2/token`, (options) => {
    assert.equal(options.method, "POST");
    assert.deepEqual(Object.fromEntries(options.body), {
      grant_type: "authorization_code",
      code: "code-fixture",
      redirect_uri: redirectUri,
      client_id: "client-fixture",
      client_secret: "secret-fixture",
    });
    return Response.json({ access_token: "access-fixture", token_type: "Bearer" });
  });
  fixtures.set(`${api}/users/@me`, (options) => {
    assert.equal(options.headers.Authorization, "Bearer access-fixture");
    return Response.json({ id: "42", username: "fixture_user", global_name: "Global Fixture", avatar: "useravatar" });
  });
  fixtures.set(`${api}/users/@me/guilds/111/member`, json({ nick: "N".repeat(60), avatar: "guildavatar" }));
  assert.deepEqual(await auth.completeDiscordLogin("code-fixture", redirectUri), {
    id: "42",
    name: "N".repeat(50),
    avatarUrl: "https://cdn.discordapp.com/guilds/111/users/42/avatars/guildavatar.png?size=128",
  });
  assert.deepEqual(calls.map((call) => call.url), [`${api}/oauth2/token`, `${api}/users/@me`, `${api}/users/@me/guilds/111/member`]);
  console.log("PASS members get their server nickname and avatar; later servers are not queried");

  fixtures.set(`${api}/users/@me/guilds/111/member`, json({ message: "Unknown Guild", code: 10004 }, 404));
  fixtures.set(`${api}/users/@me/guilds/222/member`, json({ nick: null, avatar: null }));
  assert.deepEqual(await auth.completeDiscordLogin("code-fixture", redirectUri), {
    id: "42",
    name: "Global Fixture",
    avatarUrl: "https://cdn.discordapp.com/avatars/42/useravatar.png?size=128",
  });
  console.log("PASS membership in any configured server is accepted, with account name and avatar fallback");

  fixtures.set(`${api}/users/@me/guilds/222/member`, json({ message: "Unknown Guild", code: 10004 }, 404));
  await assert.rejects(auth.completeDiscordLogin("code-fixture", redirectUri), /^Error: not_in_guild$/);
  fixtures.set(`${api}/users/@me/guilds/111/member`, json({ message: "Server error" }, 500));
  await assert.rejects(auth.completeDiscordLogin("code-fixture", redirectUri), (error) => error.message !== "not_in_guild" && /HTTP 500/.test(error.message));
  fixtures.set(`${api}/oauth2/token`, json({ error: "invalid_grant" }, 400));
  await assert.rejects(auth.completeDiscordLogin("code-fixture", redirectUri), (error) => error.message !== "not_in_guild" && /HTTP 400/.test(error.message));
  console.log("PASS non-members are rejected and Discord errors are reported as login failures");
  console.log(`All offline Discord login checks passed (${calls.length} fixture requests, zero network requests).`);
} finally {
  Date.now = realNow;
  process.chdir(originalCwd);
  rmSync(isolatedEnv, { recursive: true, force: true });
}
