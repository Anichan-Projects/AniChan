const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('characters')
      .setDescription(`${language.__n('character.command_description')}`)
      .addStringOption(option => option.setName('name').setDescription(`${language.__n('character.character_name')}`).setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply();

    const characterName = interaction.options.getString('name');

    const query = `
      query ($search: String) {
        Character(search: $search) {
          id
          siteUrl
          name {
            full
          }
          image {
            large
          }
          description
          media {
            nodes {
              title {
                romaji
              }
            }
          }
        }
      }
    `;

    const variables = { search: characterName };

    try {
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
      const characterData = data.data.Character;

      if (!characterData) {
        return interaction.editReply(`${language.__n('global.no_results')} **${characterName}**`);
      }
      let description = characterData.description || `${language.__n('global.no_description')}`;
      if (description && description.length > 600) {
        description = description.slice(0, 600) + '...';
      }

      const embed = new EmbedBuilder()
          .setTitle(characterData.name.full)
          .setURL(characterData.siteUrl)
          .setDescription(description)
          .addFields({ name: `${language.__n('character.anime_appearances')}`, value: characterData.media.nodes.map(node => node.title.romaji).join(', ') || `${language.__n('global.no_results')}` })
          .setImage(characterData.image.large)
          .setColor('#C6FFFF')
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