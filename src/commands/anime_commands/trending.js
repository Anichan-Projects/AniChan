const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('trending')
      .setDescription(`${language.__n('trending.command_description')}`),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const query = fs.readFileSync(path.join(__dirname, '../../queries/trending.graphql'), 'utf8');

      const response = await axios.post('https://graphql.anilist.co', {
        query: query
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const data = response.data;
      const trendingAnime = data.data.Page.media;
      let currentPage = 0;

      const updateEmbed = () => {
        const anime = trendingAnime[currentPage];
        const description = anime.description ? anime.description.replace(/<[^>]+>/g, '').slice(0, 250) + '...' : `${language.__n('global.unavailable')}`;
        const embedImage = "https://img.anili.st/media/" + anime.id;
        const embed = new EmbedBuilder()
            .setTitle(anime.title.romaji)
            .setURL(anime.siteUrl)
            .setDescription(`__**${language.__n('global.description')}:**__ ${description}\n__**${language.__n('global.average_score')}:**__ ${anime.averageScore}/100\n__**${language.__n('global.mean_score')}:**__ ${anime.meanScore ? anime.meanScore + '/100' : `${language.__n('global.unavailable')}`}\n\n__**${language.__n('global.page')}:**__ ${currentPage + 1}/${trendingAnime.length}`)
            .setImage(embedImage)
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

      await interaction.editReply(updateEmbed());

      const filter = i => i.customId === 'prev' || i.customId === 'next';
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        if (i.customId === 'prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'next' && currentPage < trendingAnime.length - 1) {
          currentPage++;
        }
        await i.update(updateEmbed());
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (error) {
          console.error(`${language.__n('global.error')}`, error);
        }
      });
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