const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const language = require('./../../language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language_list')
        .setDescription(`${language.__n(`langlist.command_description`)}`),
    async execute(interaction) {
        let respone = '';
        const languagecurrent = language.getLocale();
        if (languagecurrent === 'en') {
            respone = language.__n('en');
        } else if (languagecurrent === 'vi') {
            respone = language.__n('vi');
        }

        const embed = new MessageEmbed()
            .setTitle(`${language.__n(`langlist.title`)} ${respone}`)
            .setDescription(`${language.__n(`langlist.description`)}`)
            const fields = [
                { name: 'English', value: 'en', inline: true },
                { name: 'Vietnamese', value: 'vi', inline: true }
            ];

            for (let i = 0; i < language.getLocales().length; i++) {
                embed.addFields(fields[i]);
            }

            embed.setColor('#eb3434');
        await interaction.reply({ embeds: [embed] });
    },
};