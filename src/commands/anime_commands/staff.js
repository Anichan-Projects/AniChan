const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription(`${language.__n(`staff.command_description`)}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n(`staff.staff_name`)}`).setRequired(true)),
    async execute(interaction) {
        const staffName = interaction.options.getString('name');

        try {
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

            const response = await axios.post('https://graphql.anilist.co', {
                query,
                variables: { search: staffName },
            });

            const staffData = response.data.data.Staff;

            if (!staffData) {
                return interaction.reply(`${language.__n(`global.no_results`)} **${staffName}**`);
            }

            const embed = new MessageEmbed()
                .setTitle(`${language.__n(`staff.staff_info: `)} ${staffData.name.first} ${staffData.name.last}`)
                .setURL(staffData.siteUrl)
                .setDescription(staffData.description || `${language.__n(`global.unnavaliable`)}`)
                .setImage(staffData.image.large)
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error(`${language.__n(`global.error`)}`, error.response);
          interaction.reply(`${language.__n(`global.error_reply`)}`);
        }
    },
};
