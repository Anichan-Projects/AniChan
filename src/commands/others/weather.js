const weather = require('weather-js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription(`${language.__n('weather.command_description')}`)
        .addStringOption(option => option.setName('location').setDescription(`${language.__n('weather.location')}`).setRequired(true)),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const location = interaction.options.getString('location');

            weather.find({ search: location, degreeType: 'C' }, async function (error, result) {
                if (error) {
                    console.error(`${language.__n('global.error')}`, error);
                    return interaction.editReply(`${language.__n('global.error_reply')}`);
                }
                if (result === undefined || result.length === 0) {
                    return interaction.editReply(`${language.__n('global.no_results')}`);
                }

                const current = result[0].current;
                const location = result[0].location;

                const embed = new EmbedBuilder()
                    .setTitle(current.observationpoint)
                    .setDescription(`${current.skytext}`)
                    .setThumbnail(current.imageUrl)
                    .setTimestamp()
                    .addFields(
                        {
                            name: `${language.__n('weather.longitude')}`,
                            value: location.long,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.latitude')}`,
                            value: location.lat,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.degreetype')}`,
                            value: `°${location.degreetype}`,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.current_temperature')}`,
                            value: `${current.temperature}°${location.degreetype}`,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.feels_like')}`,
                            value: `${current.feelslike}°${location.degreetype}`,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.winddisplay')}`,
                            value: `${current.winddisplay}`,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.humidity')}`,
                            value: `${current.humidity}%`,
                            inline: true,
                        },
                        {
                            name: `${language.__n('weather.observationtime')}`,
                            value: `${current.observationtime}, GMT ${location.timezone}`,
                            inline: true,
                        }
                    )
                    .setFooter({ text: `${interaction.client.user.username}`, iconURL: interaction.client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                    .setColor('#66FFFF');

                await interaction.editReply({ embeds: [embed], ephemeral: true });
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