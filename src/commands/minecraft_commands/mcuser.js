const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mcuser')
        .setDescription('Get Minecraft account information')
        .addStringOption(option => option.setName('identifier').setDescription('Minecraft username or UUID').setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        const identifier = interaction.options.getString('identifier');
        let uuid, username;

        try {
            const profileResponse = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${identifier}`);
            uuid = profileResponse.data.id;
            username = profileResponse.data.name;

            const sessionResponse = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
            const properties = JSON.parse(Buffer.from(sessionResponse.data.properties[0].value, 'base64').toString('utf-8'));
            const skinUrl = properties.textures.SKIN.url;
            const capeUrl = properties.textures.CAPE ? properties.textures.CAPE.url : 'No cape available';

            const headUrl = `https://cravatar.eu/helmhead/${username}`;

            const embed = new EmbedBuilder()
                .setTitle(`Minecraft User: ${username}`)
                .setThumbnail(headUrl)
                .addFields(
                    { name: 'UUID', value: uuid, inline: true },
                    { name: 'Username', value: username, inline: true }
                )
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('mcuser_menu')
                        .setPlaceholder('Select an option')
                        .addOptions([
                            {
                                label: 'Information',
                                description: 'View user information',
                                value: 'information',
                            },
                            {
                                label: 'Skin & Cape',
                                description: 'View skin and cape information',
                                value: 'skin_cape',
                            },
                        ])
                );

            await interaction.editReply({ embeds: [embed], components: [row] });

            const filter = i => i.customId === 'mcuser_menu' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.values[0] === 'information') {
                    const infoEmbed = new EmbedBuilder()
                        .setTitle(`Minecraft User: ${username}`)
                        .setThumbnail(headUrl)
                        .addFields(
                            { name: 'UUID', value: uuid, inline: true },
                            { name: 'Username', value: username, inline: true }
                        )
                        .setTimestamp();
                    await i.update({ embeds: [infoEmbed], components: [row] });
                } else if (i.values[0] === 'skin_cape') {
                    const skinCapeEmbed = new EmbedBuilder()
                        .setTitle(`Skin & Cape for ${username}`)
                        .setThumbnail(headUrl)
                        .addFields(
                            { name: 'Skin URL', value: `[Download Skin](${skinUrl})`, inline: true },
                            { name: 'Cape URL', value: capeUrl !== 'No cape available' ? `[Download Cape](${capeUrl})` : capeUrl, inline: true }
                        )
                        .setTimestamp();
                    await i.update({ embeds: [skinCapeEmbed], components: [row] });
                }
            });

            collector.on('end', async () => {
                try {
                    await interaction.editReply({ components: [] });
                } catch (error) {
                    console.error('Error clearing components:', error);
                }
            });
        } catch (error) {
            console.error('Error fetching Minecraft user data:', error);
            await interaction.editReply('An error occurred while fetching the Minecraft user data. Please try again later.');
        }
    },
};