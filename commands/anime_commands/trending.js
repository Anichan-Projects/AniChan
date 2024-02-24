const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trending')
    .setDescription(`${language.__n(`trending.command_description`)}`),
  async execute(interaction) {
    try {
      const response = await axios.post('https://graphql.anilist.co', {
        query: `
          query {
            Page (perPage: 10) {
              media (sort: TRENDING_DESC, type: ANIME) {
                id
                title {
                  romaji
                }
                description
                coverImage {
                  large
                }
                averageScore
                meanScore
              }
            }
          }
        `,
      });

      const trendingAnime = response.data.data.Page.media;
      const embed = new MessageEmbed()
        .setTitle(`${language.__n(`trending.trending_title`)}`)
        .setDescription(`${language.__n(`trending.trending_description`)}`)
        .setTimestamp();

      trendingAnime.forEach(anime => {
        const description = anime.description ? anime.description.replace(/<[^>]+>/g, '').slice(0, 250) + '...': `${language.__n(`global.unavaliable`)}`;
        embed.addFields(
          { name: anime.title.romaji, value: `__${language.__n(`global.description`)}:__ ${description}\n__${language.__n(`global.average_score`)}:__ ${anime.averageScore}/100\n__${language.__n(`global.mean_score`)}:__ ${anime.meanScore ? anime.meanScore + '/100' : `${language.__n(`global.unavaliable`)}`}\n`, inline: false }
        );
      });

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error.response);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
