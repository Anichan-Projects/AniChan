const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription(`${language.__n('staff.command_description')}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n('staff.staff_name')}`).setRequired(true)),
    async execute(interaction) {
        const staffName = interaction.options.getString('name');

        const query = `
            query ($search: String) {
                Staff(search: $search) {
                    id
                    siteUrl
                    name {
                        first
                        last
                    }
                    image {
                        large
                    }
                    description
                }
            }
        `;

        const variables = { search: staffName };

        try {
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    variables: variables
                })
            });

            const data = await response.json();
            const staffData = data.data.Staff;

            if (!staffData) {
                return interaction.reply(`${language.__n('global.no_results')} **${staffName}**`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`${language.__n('staff.staff_info')}: ${staffData.name.first} ${staffData.name.last}`)
                .setURL(staffData.siteUrl)
                .setDescription(staffData.description || `${language.__n('global.unavailable')}`)
                .setImage(staffData.image.large)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
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