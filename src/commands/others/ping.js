const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription(`${language.__n('ping.description')}`),
    async execute(interaction) {
        if (interaction.replied || interaction.deferred) {
            return;
        }

        let pingColor;
        const ping = interaction.client.ws.ping;

        if (ping < 150) {
            pingColor = '#00ff00';
        } else if (ping >= 150 && ping <= 250) {
            pingColor = '#ffff00';
        } else {
            pingColor = '#ff0000';
        }

        const pongEmbed = new EmbedBuilder()
            .setColor(pingColor)
            .setTitle('Pong')
            .setDescription(`**${ping} ms**`)
            .setTimestamp();

        await interaction.reply({ embeds: [pongEmbed] });
    }
};