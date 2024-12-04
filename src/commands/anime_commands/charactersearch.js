const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('character_search')
      .setDescription(`${language.__n('character_search.command_description')}`)
      .addStringOption(option => option.setName('character').setDescription(`${language.__n('character_search.command_description')}`).setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const character = interaction.options.getString('character');
      const query = fs.readFileSync(path.join(__dirname, '../../queries/characters.graphql'), 'utf8');
      const variables = { character };

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
        return interaction.editReply(`${language.__n('global.no_results')} **${character}**`);
      }

      const embed = new EmbedBuilder()
          .setTitle(`${language.__n('character_search.anime_list')} ${characterData.name.full}`)
          .setDescription(`${language.__n('character_search.anime_list')} **${characterData.name.full}**:`)
          .setTimestamp();

      characterData.media.nodes.forEach(anime => {
        const animeTitle = anime.title.romaji || `${language.__n('global.unavailable')}`;
        embed.addFields({ name: animeTitle, value: '\u200B', inline: false });
      });

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