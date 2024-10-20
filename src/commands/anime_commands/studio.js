const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('studio')
        .setDescription(`${language.__n('studio.command_description')}`)
        .addStringOption(option => option.setName('name').setDescription(`${language.__n('studio.studio_name')}`).setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const studioName = interaction.options.getString('name');

        const query = `
            query ($search: String) {
                Studio(search: $search) {
                    id
                    name
                    siteUrl
                    media(isMain: true, sort: POPULARITY_DESC) {
                        nodes {
                            id
                            siteUrl
                            title {
                                romaji
                            }
                            startDate {
                                year
                            }
                        }
                    }
                }
            }
        `;

        const variables = { search: studioName };

        try {
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
            const studioData = data.data.Studio;

            if (!studioData) {
                return interaction.editReply(`${language.__n('global.no_results')} **${studioName}**`);
            }

            const animeList = studioData.media.nodes.map((anime, index) => {
                const animeTitle = anime.title.romaji;
                const animeUrl = anime.siteUrl;
                const animeYear = anime.startDate ? anime.startDate.year : `${language.__n('global.unavailable')}`;
                return `${index + 1}. [${animeTitle}](${animeUrl}) - ${language.__n('studio.product_year')}: ${animeYear}`;
            }).join('\n');

            const pageSize = 10;
            const totalPages = Math.ceil(studioData.media.nodes.length / pageSize);
            let currentPage = 0;

            const updateEmbed = () => {
                const startIdx = currentPage * pageSize;
                const endIdx = startIdx + pageSize;
                const displayedAnime = animeList.split('\n').slice(startIdx, endIdx).join('\n');

                const embed = new EmbedBuilder()
                    .setTitle(`${language.__n('studio.studio_info')} ${studioData.name}`)
                    .setURL(studioData.siteUrl)
                    .setDescription(`${language.__n('studio.product_list')} ${studioData.name}:\n${displayedAnime}`)
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
                            .setDisabled(currentPage === totalPages - 1)
                    );

                return { embeds: [embed], components: [row] };
            };

            await interaction.editReply(updateEmbed());

            const filter = i => i.customId === 'prev' || i.customId === 'next';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'prev' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next' && currentPage < totalPages - 1) {
                    currentPage++;
                }
                await interaction.editReply(updateEmbed());
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