const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const language = require('./../../language/language_setup.js');
const commandCooldown = new Map();

module.exports = {
    cooldown: 60,
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription(`${language.__n('search.command_description')}`)
        .addSubcommandGroup(group =>
            group.setName('image')
                .setDescription(`${language.__n('search.image_option')}`)
                .addSubcommand(subcommand =>
                    subcommand.setName('url')
                        .setDescription(`${language.__n('search.image_link')}`)
                        .addStringOption(option =>
                            option.setName('url')
                                .setDescription(`${language.__n('search.image_link')}`)
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('cut_black_borders')
                                .setDescription(`${language.__n('search.cut_black_borders')}`)
                                .setRequired(true)))
                .addSubcommand(subcommand =>
                    subcommand.setName('upload')
                        .setDescription(`${language.__n('search.upload_image')}`)
                        .addAttachmentOption(option =>
                            option.setName('upload')
                                .setDescription(`${language.__n('search.upload_image')}`)
                                .setRequired(true))
                        .addBooleanOption(option =>
                            option.setName('cut_black_borders')
                                .setDescription(`${language.__n('search.cut_black_borders')}`)
                                .setRequired(true)))),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const subcommand = interaction.options.getSubcommand();
            const cutBorders = interaction.options.getBoolean('cut_black_borders');
            let imageUrl;

            if (subcommand === 'url') {
                imageUrl = interaction.options.getString('url');
            } else if (subcommand === 'upload') {
                const uploadedImage = interaction.options.getAttachment('upload');
                imageUrl = uploadedImage.url;
            }

            if (commandCooldown.has(interaction.user.id)) {
                const lastUsage = commandCooldown.get(interaction.user.id);
                const currentTime = Date.now();
                const cooldownTime = 60 * 60 * 1000;

                if (currentTime - lastUsage < cooldownTime) {
                    const remainingTime = cooldownTime - (currentTime - lastUsage);
                    const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                    return interaction.editReply(`${language.__n('global.tracemoe_api_limit')} ${language.__n('global.retry')} ${remainingMinutes} ${language.__n('global.minute')}.`);
                }
            }

            let apiUrl = 'https://api.trace.moe/search?url=' + encodeURIComponent(imageUrl);
            if (cutBorders) {
                apiUrl = 'https://api.trace.moe/search?cutBorders&url=' + encodeURIComponent(imageUrl);
            }

            const response = await axios.get(apiUrl);
            const data = response.data;

            if (data.result && data.result.length > 0) {
                const animeid = data.result[0].anilist;

                const query = `
                    query ($id: Int) {
                        Media (id: $id, type: ANIME) {
                            siteUrl
                            title { romaji english native }
                            coverImage { large }
                            description
                            genres
                        }
                    }
                `;

                const variables = { id: animeid };
                const graphqlResponse = await axios.post('https://graphql.anilist.co', {
                    query: query,
                    variables: variables
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    }
                });

                const graphqlData = graphqlResponse.data;
                const media = graphqlData.data.Media;
                const animename = media.title.english || media.title.romaji || media.title.native;
                const embedImage = "https://img.anili.st/media/" + animeid;
                let description = media.description;
                if (description && description.length > 400) {
                    description = description.slice(0, 400) + '...';
                }
                const genres = media.genres;
                if (genres.includes('Ecchi') || genres.includes('Hentai')) {
                    return interaction.editReply(`**${language.__n('global.nsfw_block')} ${animename}**\n${language.__n('global.nsfw_block_reason')}`);
                }
                const episode = data.result[0].episode;
                const similarity = (data.result[0].similarity * 100).toFixed(0);

                const embed = new EmbedBuilder()
                    .setTitle(`Anime: ${animename}`)
                    .setURL(media.siteUrl)
                    .setDescription(`${language.__n('global.description')}: ${description}`)
                    .addFields(
                        { name: `${language.__n('search.appears_episode')}`, value: `${episode}`, inline: true },
                        { name: `${language.__n('search.similarity')}`, value: `${similarity} %`, inline: true }
                    )
                    .setImage(embedImage);

                await interaction.editReply({ embeds: [embed] });
                commandCooldown.set(interaction.user.id, Date.now());
            } else {
                interaction.editReply(`${language.__n('global.error_reply')}`);
            }
        } catch (error) {
            console.error(`${language.__n('global.error')}`, error);
            if (interaction.replied || interaction.deferred) {
                return interaction.editReply(`${language.__n('global.error_reply')}`);
            } else {
                return interaction.reply(`${language.__n('global.error_reply')}`);
            }
        }
    },
};