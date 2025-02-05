const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('anime')
      .setDescription(`${language.__n('anime.command_description')}`)
      .addStringOption(option => option.setName('name').setDescription(`${language.__n('anime.anime_name')}`).setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const animeName = interaction.options.getString('name');
      const query = fs.readFileSync(path.join(__dirname, '../../queries/anime.graphql'), 'utf8');
      const variables = { name: animeName };

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
      const animeData = data.data.Media;

      if (!animeData) {
        return interaction.editReply(`${language.__n('global.no_results')} **${animeName}**`);
      }

      const genres = animeData.genres;
      if (genres.includes('Ecchi') || genres.includes('Hentai')) {
        return interaction.editReply(`**${language.__n('global.nsfw_block')} ${animeName}**\n${language.__n('global.nsfw_block_reason')}`);
      }

      let description = animeData.description;
      if (description) {
        description = description.replace(/\n*<br>/g, '');
        if (description.length > 600) {
          description = description.slice(0, 600) + '...';
        }
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