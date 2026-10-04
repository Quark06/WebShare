import { Client, IntentsBitField, Events } from "discord.js";
import config from "./config.ts";
import axios from "axios";
import { redisCount } from "./utils/redis.ts";

const HOST_NAME = config.DISCORD_SITE_URL.replace(/\/$/, "");
if (!HOST_NAME || !config.DISCORD_BOT_TOKEN) {
  throw new Error("Set DISCORD_SITE_URL and DISCORD_BOT_TOKEN to run your WebShare bot.");
}
const API_NAME = (config.DISCORD_API_URL || HOST_NAME).replace(/\/$/, "");

const client = new Client({
  intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages],
});

client.on("ready", () => {
  console.log("I am ready!");
  console.log("bot is in %s guilds", client.guilds.cache.size);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "watch") {
    const preload = interaction.options.get("video")?.value;
    // Call the WebShare API to make a room
    const response = await axios.post(API_NAME + "/createRoom", {
      video: preload,
    });
    redisCount("discordBotWatch");
    // Return the generated room URL
    await interaction.reply({
      content: `Created a new WebShare${
        preload ? ` with video ${preload}` : ""
      }!
${HOST_NAME + "/watch" + response.data.name}
`,
    });
  }
});

client.login(config.DISCORD_BOT_TOKEN);
