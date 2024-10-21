const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription(`${language.__n('bot_stats.description')}`),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor(uptime / 3600) % 24;
            const minutes = Math.floor(uptime / 60) % 60;
            const seconds = Math.floor(uptime % 60);
            const embed = new EmbedBuilder()
                .setTitle(`${language.__n('bot_stats.title')}`)
                .setColor('#66ffff')
                .setFields(
                    {
                        name: `Bot Ping`,
                        value: `${interaction.client.ws.ping}ms`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.uptime')}`,
                        value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.version')}`,
                        value: `v${require('../../../package.json').version}`,
                        inline: true,
                    },
                    {
                        name: `CPU`,
                        value: `${(process.cpuUsage().system / 1024 / 1024).toFixed(2)}%`,
                        inline: true,
                    },
                    {
                        name: `RAM`,
                        value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.disk_usage')}`,
                        value: `${(process.memoryUsage().external / 1024 / 1024).toFixed(2)} MB`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.os')}`,
                        value: `${process.platform} ${process.arch}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.node')}`,
                        value: `${process.version}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n('bot_stats.library')}`,
                        value: `Discord.js v${require('discord.js').version}`,
                        inline: true,
                    },
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`${language.__n('global.error')}`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(`${language.__n('global.error_reply')}`);
            } else {
                await interaction.reply(`${language.__n('global.error_reply')}`);
            }
        }
    }
};