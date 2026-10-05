export async function resolverFetch(url: string | URL): Promise<Response> {
  return fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
}

export async function resolverText(url: string | URL): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Third-party resolver returned HTTP ${response.status}.`);
  }
  return response.text();
}

// Resolve the address without following a redirect into the media itself.
export async function resolverMediaUrl(url: string | URL): Promise<string> {
  const response = await resolverFetch(url);
  const location = response.headers.get("location");
  if (response.status >= 300 && response.status < 400 && location) {
    await response.body?.cancel();
    const target = new URL(location, url);
    if (!["http:", "https:"].includes(target.protocol)) {
      throw new Error("The third-party resolver did not return a playable URL.");
    }
    return target.toString();
  }
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Third-party resolver returned HTTP ${response.status}.`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (/^(audio|video)\//i.test(contentType) || /mpegurl/i.test(contentType)) {
    await response.body?.cancel();
    return String(url);
  }
  const text = (await response.text()).trim();
  let value: unknown;
  try {
    const data = JSON.parse(text);
    value = typeof data === "string" ? data : data.url;
  } catch {
    value = text;
  }
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) {
    throw new Error("The third-party resolver did not return a playable URL.");
  }
  return new URL(value).toString();
}
