const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('character_search')
      .setDescription(`${language.__n('character_search.command_description')}`)
      .addStringOption(option => option.setName('character').setDescription(`${language.__n('character_search.command_description')}`).setRequired(true)),
  async execute(interaction) {
    const character = interaction.options.getString('character');

    const query = `
      query ($character: String) {
        Character (search: $character) {
          name {
            full
          }
          media {
            nodes {
              id
              title {
                romaji
              }
              coverImage {
                large
              }
            }
          }
        }
      }
    `;

    const variables = { character };

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
      const characterData = data.data.Character;

      if (!characterData) {
        return interaction.reply(`${language.__n('global.no_results')} **${character}**`);
      }

      const embed = new EmbedBuilder()
          .setTitle(`${language.__n('character_search.anime_list')} ${characterData.name.full}`)
          .setDescription(`${language.__n('character_search.anime_list')} **${characterData.name.full}**:`)
          .setTimestamp();

      characterData.media.nodes.forEach(anime => {
        const animeTitle = anime.title.romaji || `${language.__n('global.unavailable')}`;
        embed.addFields({ name: animeTitle, value: '\u200B', inline: false });
      });

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