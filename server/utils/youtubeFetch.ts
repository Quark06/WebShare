import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EnvHttpProxyAgent, ProxyAgent, type Dispatcher } from "undici";
import config from "../config.ts";

const run = promisify(execFile);
let dispatcher: Promise<Dispatcher | undefined> | undefined;

async function getWindowsProxy(): Promise<string | undefined> {
  if (process.platform !== "win32") return;
  try {
    const { stdout } = await run(
      "reg.exe",
      [
        "query",
        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
      ],
      { windowsHide: true, timeout: 3000 },
    );
    const enabled = stdout.match(/ProxyEnable\s+REG_DWORD\s+(\S+)/i)?.[1];
    if (!enabled || parseInt(enabled, 16) !== 1) return;
    const server = stdout.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/i)?.[1].trim();
    if (!server) return;
    const address = server.includes("=")
      ? server
          .split(";")
          .find((entry) => entry.trim().startsWith("https="))
          ?.split("=")[1]
      : server;
    if (!address) return;
    return address.includes("://") ? address.trim() : `http://${address.trim()}`;
  } catch {
    // Registry settings are unavailable on some Windows server accounts.
    return;
  }
}

async function createDispatcher(): Promise<Dispatcher | undefined> {
  if (config.YOUTUBE_PROXY_URL) return new ProxyAgent(config.YOUTUBE_PROXY_URL);
  if (
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY
  ) {
    return new EnvHttpProxyAgent();
  }
  const systemProxy = await getWindowsProxy();
  return systemProxy ? new ProxyAgent(systemProxy) : undefined;
}

export const youtubeFetch: typeof fetch = async (input, init) => {
  dispatcher ??= createDispatcher();
  const options = {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15000),
    dispatcher: await dispatcher,
  };
  return fetch(input, options);
};
