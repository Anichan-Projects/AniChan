const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manga')
        .setDescription(`${language.__n('manga.command_description')}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n('manga.manga_name')}`).setRequired(true)),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const mangaName = interaction.options.getString('name');
            const query = fs.readFileSync(path.join(__dirname, '../../queries/manga.graphql'), 'utf8');
            const variables = { name: mangaName };

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
            const mangaData = data.data.Media;

            if (!mangaData) {
                return interaction.editReply(`${language.__n('global.no_results')} **${mangaName}**`);
            }

            const mangaGenre = mangaData.genres;
            if (mangaGenre.includes('Ecchi') || mangaGenre.includes('Hentai')) {
                return interaction.editReply(`**${language.__n('global.nsfw_block')} ${mangaName}**\n${language.__n('global.nsfw_block_reason')}`);
            }

            const description = mangaData.description ? mangaData.description.slice(0, 500) + '...' : 'Không có thông tin.';

            const embedImage = "https://img.anili.st/media/" + mangaData.id;
            console.log(embedImage);
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