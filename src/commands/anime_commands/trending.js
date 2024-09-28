const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('trending')
      .setDescription(`${language.__n('trending.command_description')}`),
  async execute(interaction) {
    const query = `
      query {
        Page (perPage: 10) {
          media (sort: TRENDING_DESC, type: ANIME) {
            id
            siteUrl
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
    `;

    try {
      const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      const trendingAnime = data.data.Page.media;
      // const genres = trendingAnime.genres;
      // if (genres === "Ecchi" || "Hentai") {
      //   trendingAnime.pop();
      //   return interaction.reply(`${language.__n('trending.error_reply')}`);
      // }
      let currentPage = 0;

      const updateEmbed = () => {
        const anime = trendingAnime[currentPage];
        const description = anime.description ? anime.description.replace(/<[^>]+>/g, '').slice(0, 250) + '...' : `${language.__n('global.unavailable')}`;
        const embed = new EmbedBuilder()
            .setTitle(anime.title.romaji)
            .setURL(anime.siteUrl)
            .setDescription(`__**${language.__n('global.description')}:**__ ${description}\n__**${language.__n('global.average_score')}:**__ ${anime.averageScore}/100\n__**${language.__n('global.mean_score')}:**__ ${anime.meanScore ? anime.meanScore + '/100' : `${language.__n('global.unavailable')}`}\n\n__**${language.__n('global.page')}:**__ ${currentPage + 1}/${trendingAnime.length}`)
            .setImage(anime.coverImage.large)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel(`${language.__n('global.preview_button')}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel(`${language.__n('global.next_button')}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === trendingAnime.length - 1)
            );

        return { embeds: [embed], components: [row] };
      };

      await interaction.reply(updateEmbed());

      const filter = i => i.customId === 'prev' || i.customId === 'next';
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'next' && currentPage < trendingAnime.length - 1) {
          currentPage++;
        }
        await interaction.editReply(updateEmbed());
      });

      collector.on('end', () => {
        interaction.editReply({ components: [] });
      });
    } catch (error) {
      console.error(`${language.__n('global.error')}`, error);
      interaction.reply(`${language.__n('global.error_reply')}`);
    }
  },
};