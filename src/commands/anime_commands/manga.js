const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manga')
        .setDescription(`${language.__n('manga.command_description')}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n('manga.manga_name')}`).setRequired(true)),
    async execute(interaction) {
        const mangaName = interaction.options.getString('name');

        const query = `
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
    `;

        const variables = { name: mangaName };

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
            const mangaData = data.data.Media;

            if (!mangaData) {
                return interaction.reply(`${language.__n('global.no_results')} **${mangaName}**`);
            }

            const mangaGenre = mangaData.genres;
            if (mangaGenre.includes('Ecchi') || mangaGenre.includes('Hentai')) {
                return interaction.reply(`**${language.__n('global.nsfw_block')} ${mangaName}**\n${language.__n('global.nsfw_block_reason')}`);
            }

            const description = mangaData.description ? mangaData.description.slice(0, 500) + '...' : 'Không có thông tin.';

            const embed = new EmbedBuilder()
                .setTitle(mangaData.title.romaji)
                .setURL(mangaData.siteUrl)
                .setDescription(description)
                .addFields(
                    {
                        name: `${language.__n('global.chapters')}`,
                        value: mangaData.chapters ? mangaData.chapters : `${language.__n('global.unavailable')}`,
                        inline: true
                    },
                    {
                        name: `${language.__n('global.genres')}`,
                        value: mangaData.genres.join(', '),
                        inline: true
                    },
                    {
                        name: `${language.__n('global.average_score')}`,
                        value: `${mangaData.averageScore}/100`,
                        inline: true
                    },
                    {
                        name: `${language.__n('global.mean_score')}`,
                        value: `${mangaData.meanScore ? mangaData.meanScore + '/100' : `${language.__n('global.unavailable')}`}`,
                        inline: true
                    },
                )
                .setImage(mangaData.coverImage.large)
                .setTimestamp();

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