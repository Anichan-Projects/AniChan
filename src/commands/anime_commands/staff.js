const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription(`${language.__n('staff.command_description')}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n('staff.staff_name')}`).setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();

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

            const response = await axios.post('https://graphql.anilist.co', {
                query: query,
                variables: variables
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            const data = response.data;
            const staffData = data.data.Staff;

            if (!staffData) {
                return interaction.editReply(`${language.__n('global.no_results')} **${staffName}**`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`${language.__n('staff.staff_info')}: ${staffData.name.first} ${staffData.name.last}`)
                .setURL(staffData.siteUrl)
                .setDescription(staffData.description || `${language.__n('global.unavailable')}`)
                .setImage(staffData.image.large)
                .setTimestamp();

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