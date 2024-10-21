const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const language = require('./language/language_setup.js');

const activities = [
  { type: ActivityType.Watching, text: 'anime' },
  { type: ActivityType.Watching, text: 'invite.anichan.asia' },
];

function setRandomActivity() {
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  client.user.setActivity(randomActivity.text, { type: randomActivity.type });
}

client.once('ready', () => {
  console.log(`${language.__n(`global.status_ready`)}`);

  setRandomActivity();
  setInterval(() => {
    setRandomActivity();
  }, 10 * 60 * 1000);
});

client.login(process.env.BOT_TOKEN);