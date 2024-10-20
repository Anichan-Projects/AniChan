const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription(`${language.__n(`help.command_description`)}`),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const embed = new EmbedBuilder()
                .setTitle(`${language.__n(`help.command_title`)}`)
                .setDescription(`${language.__n(`help.embed_description`)}`)
                .setTimestamp();

            const commandsDirectory = path.join(__dirname, '..');
            const commandFolders = fs.readdirSync(commandsDirectory).filter(file => fs.statSync(path.join(commandsDirectory, file)).isDirectory());

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsDirectory, folder);
                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    const command = require(filePath);
                    embed.addFields({ name: command.data.name, value: command.data.description });
                }
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`${language.__n(`global.error`)}`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(`${language.__n(`global.error_reply`)}`);
            } else {
                await interaction.reply(`${language.__n(`global.error_reply`)}`);
            }
        }
    },
};