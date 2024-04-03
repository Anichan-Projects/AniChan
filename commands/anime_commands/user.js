const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('./../../language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription(`${language.__n('user.command_description')}`)
    .addStringOption(option => option.setName('username').setDescription(`${language.__n('user.user_name')}`).setRequired(true)),
  async execute(interaction) {
    const username = interaction.options.getString('username');

    try {
      const query = `
        query ($username: String) {
          User(name: $username) {
            id
            name
            about
            siteUrl
            avatar {
              large
            }
            statistics {
              anime {
                count
                minutesWatched
              }
              manga {
                count
                chaptersRead
              }
            }
          }
        }
      `;

      const response = await axios.post('https://graphql.anilist.co', {
        query,
        variables: { username },
      });

      const userData = response.data.data.User;

      if (!userData) {
        return interaction.reply(`${language.__n(`global.no_results`)}: **${username}**`);
      }
      const embed = new MessageEmbed()
        .setTitle(userData.name)
        .setURL(userData.siteUrl)
        .setColor('#C6FFFF')
        .addFields(
          {
            name: 'Đã xem',
            value: `${userData.statistics.anime.count} ${language.__n('user.anime_count')}.`,
            inline: true,
          },
          {
            name: 'Đã xem',
            value: `${userData.statistics.anime.minutesWatched} ${language.__n('user.manga_count')}`,
            inline: true,
          },
          {
            name: 'Đã xem',
            value: `${userData.statistics.manga.count} ${language.__n('user.minutes_watched')}.`,
            inline: true,
          },
          {
            name: 'Đã đọc',
            value: `${userData.statistics.manga.chaptersRead} ${language.__n('user.chapters_read')}.`,
            inline: true,
          }
        )
        .setThumbnail(userData.avatar.large)
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error.response);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
