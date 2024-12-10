const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription(`${language.__n('schedule.command_description')}`),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const query = fs.readFileSync(path.join(__dirname, '../../queries/schedule.graphql'), 'utf8');
            let currentPage = 1;
            const perPage = 10;
            const airingAtGreater = Math.floor(Date.now() / 1000);

            const fetchPage = async (page) => {
                const variables = { page, perPage, airingAtGreater };
                const response = await axios.post('https://graphql.anilist.co', {
                    query: query,
                    variables: variables
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                });
                return response.data.data.Page;
            };

            let pageData = await fetchPage(currentPage);

            if (!pageData.airingSchedules.length) {
                return interaction.editReply(`${language.__n('global.no_results')}`);
            }

            const updateEmbed = () => {
                const scheduleList = pageData.airingSchedules.map(item => {
                    const airDate = new Date(item.airingAt * 1000).toLocaleString();
                    return `**${item.media.title.romaji}** - Episode ${item.episode} - Airing at: ${airDate} - [Link](${item.media.siteUrl})`;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(`${language.__n('schedule.airing_schedule')}`)
                    .setDescription(scheduleList)
                    .setTimestamp();

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev')
                            .setLabel(`${language.__n('global.preview_button')}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 1),
                        new ButtonBuilder()
                            .setCustomId('next')
                            .setLabel(`${language.__n('global.next_button')}`)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(!pageData.pageInfo.hasNextPage)
                    );

                return { embeds: [embed], components: [row] };
            };

            await interaction.editReply(updateEmbed());

            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 200000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev' && currentPage > 1) {
                    currentPage--;
                } else if (i.customId === 'next' && pageData.pageInfo.hasNextPage) {
                    currentPage++;
                }
                pageData = await fetchPage(currentPage);
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