const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('character_search')
    .setDescription(`${language.__n(`character_search.command_description`)}`)
    .addStringOption(option => option.setName('character').setDescription(`${language.__n(`character_search.command_description`)}`).setRequired(true)),
  async execute(interaction) {
    const character = interaction.options.getString('character');

    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: `
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
              genres
            }
          }
        `,
        variables: { character },
      });

      const characterData = response.data.data.Character;

      if (!characterData) {
        return interaction.reply(`${language.__n(`global.no_results`)} **${character}**`);
      }

      const embed = new MessageEmbed()
        .setTitle(`${language.__n(`character_search.anime_list`)} ${characterData.name.full}`)
        .setDescription(`${language.__n(`character_search.anime_list`)} **${characterData.name.full}**:`)
        .setTimestamp();

      characterData.media.nodes.forEach(anime => {
        const animeTitle = anime.title.romaji || `${language.__n(`global.unavailable`)}`;
        embed.addFields({ name: animeTitle, value: '\u200B', inline: false });
      });

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
