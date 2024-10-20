const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('popular')
        .setDescription(`${language.__n('popular.command_description')}`),
    async execute(interaction) {
        await interaction.deferReply();

        const query = `
      query {
        Page (perPage: 10) {
          media (sort: POPULARITY_DESC, type: ANIME) {
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
            const response = await axios.post('https://graphql.anilist.co', {
                query: query
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            const data = response.data;
            const popularAnime = data.data.Page.media;
            let currentPage = 0;

            const updateEmbed = () => {
                const anime = popularAnime[currentPage];
                const description = anime.description ? anime.description.replace(/<[^>]+>/g, '').slice(0, 250) + '...' : `${language.__n('global.unavailable')}`;
                const embedImage = "https://img.anili.st/media/" + anime.id;
                const embed = new EmbedBuilder()
                    .setTitle(anime.title.romaji)
                    .setURL(anime.siteUrl)
                    .setDescription(`__**${language.__n('global.description')}:**__ ${description}\n__**${language.__n('global.average_score')}:**__ ${anime.averageScore}/100\n__**${language.__n('global.mean_score')}:**__ ${anime.meanScore ? anime.meanScore + '/100' : `${language.__n('global.unavailable')}`}\n\n__**${language.__n('global.page')}:**__ ${currentPage + 1}/${popularAnime.length}`)
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
                            .setDisabled(currentPage === popularAnime.length - 1)
                    );

                return { embeds: [embed], components: [row] };
            };

            await interaction.editReply(updateEmbed());

            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next' && currentPage < popularAnime.length - 1) {
                    currentPage++;
                }
                await i.update(updateEmbed());
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] });
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