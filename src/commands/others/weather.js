const weather = require('weather-js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const language = require('./../../language/language_setup.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription(`${language.__n(`weather.command_description`)}`)
        .addStringOption(option => option.setName("location").setDescription(`${language.__n(`weather.location`)}`).setRequired(true)),

    async execute(interaction) {
        const location = interaction.options.getString('location');

        weather.find({ search: location, degreeType: 'C' }, function (error, result) {
            if (error) return interaction.reply(error);
            if (result === undefined || result.length === 0) return interaction.reply(`${language.__n(`global.error_reply`)}`);

            const current = result[0].current;
            const location = result[0].location;

            const embed = new MessageEmbed()
                .setTitle(current.observationpoint)
                .setDescription(`${current.skytext}`)
                .setThumbnail(current.imageUrl)
                .setTimestamp()
                .addFields(
                    {
                        name: `${language.__n(`weather.longitude`)}`,
                        value: location.long,
                        inline: true,
                    },
                    { 
                        name: `${language.__n(`weather.latitude`)}`, 
                        value: location.lat, 
                        inline: true },
                    {
                        name: `${language.__n(`weather.degreetype`)}`,
                        value: `°${location.degreetype}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n(`weather.current_temperature`)}`,
                        value: `${current.temperature}°${location.degreetype}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n(`weather.feels_like`)}`,
                        value: `${current.feelslike}°${location.degreetype}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n(`weather.winddisplay`)}`,
                        value: `${current.winddisplay}`,
                        inline: true,
                    },
                    {
                        name: `${language.__n(`weather.humidity`)}`,
                        value: `${current.humidity}%`,
                        inline: true,
                    },
                    {
                        name: `${language.__n(`weather.observationtime`)}`,
                        value: `${current.observationtime}, GMT ${location.timezone}`,
                        inline: true,
                    }
                )
                .setFooter({ text: `${interaction.client.user.username}`, iconURL: interaction.client.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }) })
                .setColor('#66FFFF');

            interaction.reply({ embeds: [embed] });
        });
    },
};

