const { Client, Intents, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const language = require('./language/language_setup.js');

dotenv.config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const token = process.env.BOT_TOKEN;

const commands = new Collection();
const commandsDirectory = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsDirectory);
for (const folder of commandFolders) {
    const folderPath = path.join(commandsDirectory, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);
        commands.set(command.data.name, command);
    }
}

client.once('ready', () => {
  console.log(`${client.user.tag} ${language.__n(`global.ready`)}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    interaction.reply(`${language.__n(`global.command_error`)}`);
  }
});

client.login(token).then(() => {
  console.log(`${language.__n(`global.waiting_command`)}`);
  const commandsArray = commands.map(command => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(token);

  rest.put(Routes.applicationCommands(client.user.id), { body: commandsArray })
    .then(() => console.log(`${language.__n(`global.command_register`)}`))
    .catch(error => console.error(`${language.__n(`global.command_register_error`)}`, error));
});

require('./status.js');

client.on('guildCreate', async (guild) => {
  try {
    console.log(`${language.__n(`global.guild_join`)}: ${guild.name} (ID: ${guild.id}).`);

    const commandsArray = commands.map(command => command.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(token);

    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: commandsArray });

    console.log(`${language.__n(`global.command_register`)}: ${guild.name} (ID: ${guild.id})`);
  } catch (error) {
    console.error(`${language.__n(`global.server_register_error`)} ${guild.name} (ID: ${guild.id})`, error);
  }
});
