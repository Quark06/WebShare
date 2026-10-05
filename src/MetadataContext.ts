import firebase from "firebase/compat/app";
import React from "react";

export const DEFAULT_STATE = {
  user: undefined as firebase.User | undefined,
  streamPath: undefined as string | undefined,
  beta: false,
  discordUser: undefined as DiscordUser | undefined,
};

export const MetadataContext = React.createContext(DEFAULT_STATE);
