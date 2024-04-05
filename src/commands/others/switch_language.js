const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    owner: true,
    data:new SlashCommandBuilder()
        .setName('switch_language')
        .setDescription(`${language.__n(`language.command_description`)}`)
        .addStringOption(option => option.setName('language').setDescription(`${language.__n(`language.language_option`)}`).setRequired(true)),
    async execute(interaction) {
        const languageres = interaction.options.getString('language');
        language.setLocale(languageres);
        let respone = '';
        if (languageres === 'en') {
            respone = `${language.__n(`en`)}`;
        } else if (languageres === 'vi') {
            respone = `${language.__n(`vi`)}`;
        }
        const embed = new MessageEmbed()
            .setTitle(`${language.__n(`language.language_switch`)}`)
            .setDescription(`${language.__n(`language.respone_language`)} ${respone}`)
            .setColor('#eb3434');
        await interaction.reply({ embeds: [embed] });
    },
};
