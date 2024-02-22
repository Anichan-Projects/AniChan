const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language_setup.js');
const commandCooldown = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription(`${language.__n(`search.command_description`)}`)
        .addStringOption(option =>
            option.setName('image')
                .setDescription(`${language.__n(`search.image_link`)}`)
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('cut_black_borders')
                .setDescription(`${language.__n(`search.cut_black_borders`)}`)
                .setRequired(true)),
    async execute(interaction) {
        const imageUrl = interaction.options.getString('image');
        const cutBorders = interaction.options.getBoolean('cut_borders');
        
        if (commandCooldown.has(interaction.user.id)) {
            const lastUsage = commandCooldown.get(interaction.user.id);
            const currentTime = Date.now();
            const cooldownTime = 60 * 60 * 1000;

            if (currentTime - lastUsage < cooldownTime) {
                const remainingTime = cooldownTime - (currentTime - lastUsage);
                const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                return interaction.reply(`${language.__n(`global.tracemoe_api_limit`)} ${language.__n(`global.retry`)} ${remainingMinutes} ${language.__n(`global.minute`)}.`);
            }
        }

        try {
            let apiUrl = 'https://api.trace.moe/search?url=' + encodeURIComponent(imageUrl);
            if (cutBorders) {
                apiUrl = 'https://api.trace.moe/search?cutBorders&url=' + encodeURIComponent(imageUrl);
            }

            const response = await axios.get(apiUrl, { maxContentLength: 26214400 });
            const data = response.data;
            if (data.result && data.result.length > 0) {
                const animeid = data.result[0].anilist;
                const response = await axios.post('https://graphql.anilist.co', {
                    query: `
                        query ($id: Int) {
                            Media (id: $id, type: ANIME) {
                                siteUrl
                                title { romaji english native }
                                coverImage { large }
                                description
                                genres
                            }
                        }`,
                    variables: { id: animeid },
                });

                const animename = response.data.data.Media.title.english || response.data.data.Media.title.romaji || response.data.data.Media.title.native;
                const coverImage = response.data.data.Media.coverImage.large;
                let description = response.data.data.Media.description;
                if (description && description.length > 400) {
                    description = description.slice(0, 400) + '...';
                }
                const genres = response.data.data.Media.genres;
                if (genres.includes('Ecchi') || genres.includes('Hentai')) {
                    return interaction.reply(`**${language.__n(`global.nsfw_block`)} ${animeName}**\n${language.__n(`global.nsfw_block_reason`)}`);
                }
                const episode = data.result[0].episode;
                const similarity = data.result[0].similarity * 100;
                const similarityINT = similarity.toFixed(0);

                const embed = new MessageEmbed()
                    .setTitle(`Anime: ${animename}`)
                    .setURL(`https://anilist.co/anime/${animeid}`)
                    .setDescription(`${language.__n(`global.description`)}: ${description}`)
                    .addFields(
                        { name: `${language.__n(`search.appears_episode`)}`, value: `${episode}`, inline: true },
                        { name: `${language.__n(`search.similarity`)}`, value: `${similarityINT} %`, inline: true }
                    )
                    .setImage(`${coverImage}`);

                interaction.reply({ embeds: [embed] });

                commandCooldown.set(interaction.user.id, Date.now());
            } else {
                interaction.reply(`${language.__n(`global.error_reply`)}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 413) {
                return interaction.reply(`${language.__n(`search.file_too_large`)}`);
            }
            else if (error.response && error.response.status === 429) {
                return interaction.reply(`${language.__n(`search.tracemoe_api_limit`)}`);
            }
            else if (error.response && error.response.status === 400) {
                return interaction.reply(`${language.__n(`global.error_reply`)}`);
            }
            console.error(error);
        }
    },
};
