const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('manga')
    .setDescription(`${language.__n(`manga.command_description`)}`)
    .addStringOption(option => option.setName('name').setDescription(`${language.__n(`manga.manga_name`)}`).setRequired(true)),
  async execute(interaction) {
    const MangaName = interaction.options.getString('name');

    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: `
          query ($name: String) {
            Media (search: $name, type: MANGA) {
              id
              siteUrl
              title {
                romaji
              }
              description
              coverImage {
                large
              }
              chapters
              genres
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
        variables: { name: MangaName },
      });

      const MangaData = response.data.data.Media;

      if (!MangaData) {
        return interaction.reply(`${language.__n(`global.no_results`)} **${MangaName}**`);
      }

      const MangaGenre = MangaData.genres;
      if (MangaGenre.includes('Ecchi') || MangaGenre.includes('Hentai')) {
        return interaction.reply(`**${language.__n(`global.nsfw_block`)} ${animeName}**\n${language.__n(`global.nsfw_block_reason`)}`);
      }

      const description = MangaData.description ? MangaData.description.slice(0, 500) + '...' : 'Không có thông tin.';

      const embed = new MessageEmbed()
        .setTitle(MangaData.title.romaji)
        .setURL(MangaData.siteUrl)
        .setDescription(description)
        .addFields(
          {
             name: `${language.__n(`global.chapters`)}`, 
             value: MangaData.chapters ? Manga.chapters : `${language.__n(`global.unavailable`)}`, 
             inline: true 
          },
          {
             name: `${language.__n(`global.genres`)}`, 
             value: MangaData.genres.join(', '), 
             inline: true 
          },
          {
             name: `${language.__n(`global.average_score`)}`,
             value: `${MangaData.averageScore}/100`, 
             inline: true 
          },
          {
             name: `${language.__n(`global.mean_score`)}`, 
             value: `${MangaData.meanScore ? MangaData.meanScore + '/100' : `${language.__n(`global.unavailable`)}`}`, 
             inline: true 
          },
        )
        .setImage(MangaData.coverImage.large)
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error.response);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
