export default {
  VITE_SERVER_HOST: import.meta.env.VITE_SERVER_HOST,
  VITE_OAUTH_REDIRECT_HOSTNAME:
    import.meta.env.VITE_OAUTH_REDIRECT_HOSTNAME || window.location.origin,
  VITE_FIREBASE_CONFIG:
    import.meta.env.VITE_FIREBASE_CONFIG ?? "",
  VITE_DISCORD_CLIENT_ID: import.meta.env.VITE_DISCORD_CLIENT_ID ?? "",
  VITE_FIREBASE_SIGNIN_METHODS: "facebook,google,email",
  VITE_ICE_SERVERS: import.meta.env.VITE_ICE_SERVERS ?? "",
  NODE_ENV: import.meta.env.DEV ? "development" : "production",
};
