const { SlashCommandBuilder } = require('@discordjs/builders');
const figlet = require('figlet');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ascii')
        .setDescription(`${language.__n(`ascii.command_description`)}`)
        .addStringOption(option =>
            option.setName('text')
                .setDescription(`${language.__n(`ascii.text`)}`)
                .setRequired(true)),

    async execute(interaction) {
        const text = interaction.options.getString('text');

        figlet.text(text, function (err, data) {
            if (err) {
                console.dir(err);
            }
            if (data.length > 2000) return interaction.reply(`**${language.__n(`ascii.text_limit`)}**`);

            interaction.reply('```' + data + '```');
        });
    },
};
