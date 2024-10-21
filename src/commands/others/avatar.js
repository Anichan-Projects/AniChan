const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription(`${language.__n('avatar.command_description')}`)
        .addUserOption(option =>
            option.setName('user')
                .setDescription(`${language.__n('avatar.user_name')}`)
                .setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.find(m => m.user.id === user.id) || interaction.member;

            const avatar = member.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 });

            const embed = new EmbedBuilder()
                .setTitle(`${member.user.username} Avatar`)
                .setURL(avatar)
                .setImage(avatar)
                .setFooter({
                    text: `${language.__n('avatar.requested_by')}: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 })
                })
                .setColor('#eb3434');

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(`${language.__n('global.error')}`, error);
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(`${language.__n('global.error_reply')}`);
            } else {
                await interaction.reply(`${language.__n('global.error_reply')}`);
            }
        }
    },
};