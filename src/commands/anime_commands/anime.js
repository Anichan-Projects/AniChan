const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription(`${language.__n(`anime.command_description`)}`)
    .addStringOption(option => option.setName('name').setDescription(`${language.__n(`anime.anime_name`)}`).setRequired(true)),
  async execute(interaction) {
    const animeName = interaction.options.getString('name');

    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: `
          query ($name: String) {
            Media (search: $name, type: ANIME) {
              id
              siteUrl
              title {
                romaji
              }
              description
              coverImage {
                large
              }
              format
              episodes
              status
              startDate {
                year
                month
                day
              }
              endDate {
                year
                month
                day
              }
              season
              averageScore
              meanScore
              studios(isMain: true) {
                edges {
                  node {
                    name
                  }
                }
              }
              genres
            }
          }
        `,
        variables: { name: animeName },
      });
    
      const animeData = response.data.data.Media;
    
      if (!animeData) {
        return interaction.reply(`${language.__n(`global.no_results`)} **${animeName}**`);
      }

      const genres = animeData.genres;
      if (genres.includes('Ecchi') || genres.includes('Hentai')) {

        return interaction.reply(`**${language.__n(`global.nsfw_block`)} ${animeName}**\n${language.__n(`global.nsfw_block_reason`)}`);
      }
    
      let description = animeData.description;
      if (description && description.length > 400) {
        description = description.slice(0, 400) + '...';
      }
    
      const embed = new MessageEmbed()
        .setTitle(animeData.title.romaji)
        .setURL(animeData.siteUrl)
        .setDescription(description)
        .setColor('#66FFFF')
        .addFields(
          { name: `${language.__n(`global.episodes`)}`,          value: `${animeData.episodes || `${language.__n(`global.unavailable`)}`}`,                                    inline: true, },
          { name: `${language.__n(`global.status`)}`,      value: `${animeData.status}`,                                               inline: true, },
          { name: `${language.__n(`global.average_score`)}`,        value: `${animeData.averageScore}/100`,                                     inline: true, },
          { name: `${language.__n(`global.mean_score`)}`,        value: `${animeData.meanScore}/100`,                                        inline: true, },
          { name: `${language.__n(`global.season`)}`,             value: `${animeData.season} - ${animeData.startDate.year}`,                 inline: true, },
          { name: `${language.__n(`global.studio`)}`,          value: `${animeData.studios.edges.map(edge => edge.node.name).join(', ')}`, inline: true, }
        )
        .setImage(animeData.coverImage.large)
        .setTimestamp();
    
      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error.response);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
