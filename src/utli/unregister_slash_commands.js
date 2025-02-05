const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Started removing all slash commands.');

        const globalCommands = await rest.get(Routes.applicationCommands(clientId));
        const globalCommandIds = globalCommands.map(command => command.id);

        for (const commandId of globalCommandIds) {
            await rest.delete(Routes.applicationCommand(clientId, commandId));
        }

        console.log('Successfully removed all global slash commands.');

        const guilds = await rest.get(Routes.userGuilds());

        for (const guild of guilds) {
            const guildCommands = await rest.get(Routes.applicationGuildCommands(clientId, guild.id));
            const guildCommandIds = guildCommands.map(command => command.id);

            for (const commandId of guildCommandIds) {
                await rest.delete(Routes.applicationGuildCommand(clientId, guild.id, commandId));
            }

            console.log(`Successfully removed all slash commands in guild ${guild.id}.`);
        }

        console.log('Successfully removed all slash commands in all guilds.');
    } catch (error) {
        console.error('Error removing slash commands:', error);
    }
})();