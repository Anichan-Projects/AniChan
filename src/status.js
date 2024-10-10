const { Client, IntentsBitField } = require("discord.js");
const language = require("./language/language_setup.js");
const dotenv = require("dotenv");
dotenv.config();
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

let status = [
  { name: "Anime", type: 0 },
  { name: "invite.anichan.asia", type: 0 },
];

client.once("ready", () => {
  console.log(`${language.__n(`global.status_ready`)}`);

  setInterval(() => {
    let random = Math.floor(Math.random() * status.length);
    client.user.setActivity(status[random]);
  }, 360000);
});

client.login(process.env.BOT_TOKEN);
