const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('anime')
      .setDescription(`${language.__n('anime.command_description')}`)
      .addStringOption(option => option.setName('name').setDescription(`${language.__n('anime.anime_name')}`).setRequired(true)),
  async execute(interaction) {
    const animeName = interaction.options.getString('name');

    const query = `
      query ($name: String) {
        Media (search: $name, type: ANIME) {
          id
          siteUrl
          title {
            romaji
            english
            native
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
          studios (isMain: true) {
            edges {
              node {
                name
              }
            }
          }
          genres
        }
      }
    `;

    const variables = { name: animeName };

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
      const animeData = data.data.Media;

      if (!animeData) {
        return interaction.reply(`${language.__n('global.no_results')} **${animeName}**`);
      }

      const genres = animeData.genres;
      if (genres.includes('Ecchi') || genres.includes('Hentai')) {
        return interaction.reply(`**${language.__n('global.nsfw_block')} ${animeName}**\n${language.__n('global.nsfw_block_reason')}`);
      }

      let description = animeData.description;
      if (description && description.length > 400) {
        description = description.slice(0, 400) + '...';
      }
      const embedImage = "https://img.anili.st/media/" + animeData.id;
      const embed = new EmbedBuilder()
          .setTitle(animeData.title.romaji)
          .setURL(animeData.siteUrl)
          .setDescription(description)
          .setColor('#66FFFF')
          .addFields(
              { name: `${language.__n('global.episodes')}`, value: `${animeData.episodes || `${language.__n('global.unavailable')}`}`, inline: true },
              { name: `${language.__n('global.status')}`, value: `${animeData.status}`, inline: true },
              { name: `${language.__n('global.average_score')}`, value: `${animeData.averageScore}/100`, inline: true },
              { name: `${language.__n('global.mean_score')}`, value: `${animeData.meanScore}/100`, inline: true },
              { name: `${language.__n('global.season')}`, value: `${animeData.season} - ${animeData.startDate.year}`, inline: true },
              { name: `${language.__n('global.studio')}`, value: `${animeData.studios.edges.map(edge => edge.node.name).join(', ')}`, inline: true }
          )
          .setImage(embedImage)
          .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n('global.error')}`, error);
      interaction.reply(`${language.__n('global.error_reply')}`);
    }
  },
};