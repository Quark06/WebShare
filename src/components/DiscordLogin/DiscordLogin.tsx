import { useEffect } from "react";
import { Alert, Button, Loader, Title } from "@mantine/core";
import { IconBrandDiscordFilled } from "@tabler/icons-react";
import { serverPath } from "../../utils/utils";

// Set after a successful login so an expired session logs in again without a click
export const discordLoginKey = "webshare-discord-login";

const errors: StringDict = {
  not_in_guild: "This Discord account isn't a member of the required server.",
  failed: "Discord login failed. Please try again.",
};

const pageStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  gap: 20,
  minHeight: "100vh",
  padding: 16,
  textAlign: "center",
} as const;

export const DiscordLogin = () => {
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("discordAuthError");
  params.delete("discordAuthError");
  const query = params.toString();
  const returnTo =
    window.location.pathname + (query ? "?" + query : "") + window.location.hash;
  const loginUrl =
    serverPath + "/auth/discord/login?returnTo=" + encodeURIComponent(returnTo);
  // Discord skips its authorization page for accounts that authorized before.
  // Try once per tab so a cookie that doesn't stick can't cause a redirect loop.
  const autoLogin =
    !errorCode &&
    Boolean(window.localStorage.getItem(discordLoginKey)) &&
    !window.sessionStorage.getItem(discordLoginKey);

  useEffect(() => {
    if (errorCode === "not_in_guild") {
      window.localStorage.removeItem(discordLoginKey);
    }
    if (autoLogin) {
      window.sessionStorage.setItem(discordLoginKey, "1");
      window.location.replace(loginUrl);
    }
  }, []);

  if (autoLogin) {
    return (
      <div style={pageStyle}>
        <Loader />
        <div>Logging in with Discord. . .</div>
      </div>
    );
  }
  const error = errorCode ? errors[errorCode] : undefined;
  return (
    <div style={pageStyle}>
      <img src="/logo.svg" alt="WebShare" width={96} height={96} />
      <Title order={2}>Log in to WebShare</Title>
      <div>Members of the required Discord server can log in to continue.</div>
      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}
      <Button
        component="a"
        href={loginUrl}
        size="lg"
        color="#5865F2"
        leftSection={<IconBrandDiscordFilled />}
      >
        Log in with Discord
      </Button>
    </div>
  );
};
