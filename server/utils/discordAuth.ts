import crypto from "node:crypto";
import config from "../config.ts";

const discordApi = "https://discord.com/api/v10";
const sessionCookieName = "webshare_session";
const stateCookieName = "webshare_discord_state";
const stateSeconds = 10 * 60;

export function isDiscordAuthEnabled() {
  return Boolean(
    config.DISCORD_AUTH_CLIENT_ID &&
      config.DISCORD_AUTH_CLIENT_SECRET &&
      guildIds().length,
  );
}

function guildIds() {
  return String(config.DISCORD_AUTH_GUILD_ID)
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d+$/.test(id));
}

function sessionSeconds() {
  const days = Number(config.DISCORD_AUTH_SESSION_DAYS);
  return (days > 0 ? days : 30) * 24 * 60 * 60;
}

function hmac(body: string) {
  const key = crypto
    .createHmac("sha256", config.DISCORD_AUTH_CLIENT_SECRET)
    .update("webshare-session")
    .digest();
  return crypto.createHmac("sha256", key).update(body).digest();
}

// The kind keeps a signed OAuth state from being replayed as a session.
function sign(kind: "session" | "state", payload: object, seconds: number) {
  const body = Buffer.from(
    JSON.stringify({ ...payload, kind, exp: Date.now() + seconds * 1000 }),
  ).toString("base64url");
  return `${body}.${hmac(body).toString("base64url")}`;
}

function verify(kind: "session" | "state", token: string | undefined): any {
  const [body, signature] = token?.split(".") ?? [];
  if (!body || !signature) return;
  const expected = hmac(body);
  const actual = Buffer.from(signature, "base64url");
  if (
    actual.length !== expected.length ||
    !crypto.timingSafeEqual(actual, expected)
  )
    return;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload?.kind !== kind || !(payload.exp > Date.now())) return;
    return payload;
  } catch {
    return;
  }
}

function getCookie(header: string | undefined, name: string) {
  for (const part of header?.split(";") ?? []) {
    const index = part.indexOf("=");
    if (index > 0 && part.slice(0, index).trim() === name) {
      return part.slice(index + 1).trim();
    }
  }
}

function cookie(name: string, value: string, seconds: number, secure: boolean) {
  return `${name}=${value}; Max-Age=${seconds}; Path=/; HttpOnly; SameSite=Lax${
    secure ? "; Secure" : ""
  }`;
}

export function sessionToken(user: DiscordUser) {
  return sign("session", user, sessionSeconds());
}

// Sessions last a fixed time from login so membership is checked again when they expire
export function readDiscordSession(
  cookieHeader: string | undefined,
): DiscordUser | undefined {
  const payload = verify(
    "session",
    getCookie(cookieHeader, sessionCookieName),
  );
  if (typeof payload?.id !== "string" || typeof payload.name !== "string") {
    return;
  }
  const user: DiscordUser = { id: payload.id, name: payload.name };
  if (typeof payload.avatarUrl === "string") user.avatarUrl = payload.avatarUrl;
  return user;
}

export function sessionCookie(user: DiscordUser, secure: boolean) {
  return cookie(sessionCookieName, sessionToken(user), sessionSeconds(), secure);
}

export function stateCookie(state: string, returnTo: string, secure: boolean) {
  return cookie(
    stateCookieName,
    sign("state", { state, returnTo }, stateSeconds),
    stateSeconds,
    secure,
  );
}

export function clearStateCookie(secure: boolean) {
  return cookie(stateCookieName, "", 0, secure);
}

export function readDiscordState(
  cookieHeader: string | undefined,
): { state: string; returnTo: string } | undefined {
  const payload = verify("state", getCookie(cookieHeader, stateCookieName));
  if (typeof payload?.state !== "string") return;
  return { state: payload.state, returnTo: safeReturnTo(payload.returnTo) };
}

export function discordRedirectUri(protocol: string, host: string) {
  return (
    config.DISCORD_AUTH_REDIRECT_URI ||
    `${protocol}://${host}/auth/discord/callback`
  );
}

export function discordAuthorizeUrl(state: string, redirectUri: string) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: config.DISCORD_AUTH_CLIENT_ID,
    scope: "identify guilds.members.read",
    redirect_uri: redirectUri,
    state,
    // Skip the consent screen for users who already authorized the app
    prompt: "none",
  }).toString();
  return url.toString();
}

// Only same-site paths; browsers treat "//host" and "/\host" as other sites.
export function safeReturnTo(input: unknown): string {
  if (typeof input !== "string" || !input.startsWith("/")) return "/";
  const base = "http://webshare.invalid";
  const url = URL.parse(input, base);
  if (!url) return "/";
  const path = url.pathname + url.search + url.hash;
  return url.origin === base && !path.startsWith("//") ? path : "/";
}

async function discordRequest(path: string, init: RequestInit): Promise<any> {
  const response = await fetch(discordApi + path, {
    ...init,
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 404) {
    await response.body?.cancel();
    return;
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Discord ${path} returned HTTP ${response.status}.`);
  }
  return response.json();
}

// Throws "not_in_guild" when the account isn't in any allowed server.
export async function completeDiscordLogin(
  code: string,
  redirectUri: string,
): Promise<DiscordUser> {
  const token = await discordRequest("/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.DISCORD_AUTH_CLIENT_ID,
      client_secret: config.DISCORD_AUTH_CLIENT_SECRET,
    }),
  });
  if (typeof token?.access_token !== "string") {
    throw new Error("Discord did not return an access token.");
  }
  const headers = { Authorization: `Bearer ${token.access_token}` };
  const user = await discordRequest("/users/@me", { headers });
  if (!user?.id) throw new Error("Discord did not return the account.");
  for (const guildId of guildIds()) {
    const member = await discordRequest(
      `/users/@me/guilds/${guildId}/member`,
      { headers },
    );
    if (!member) continue;
    const result: DiscordUser = {
      id: String(user.id),
      name: String(member.nick || user.global_name || user.username).slice(
        0,
        50,
      ),
    };
    if (member.avatar) {
      result.avatarUrl = `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.png?size=128`;
    } else if (user.avatar) {
      result.avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
    }
    return result;
  }
  throw new Error("not_in_guild");
}
