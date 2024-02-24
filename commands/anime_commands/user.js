const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Hiển thị thông tin tổng quan về người dùng trên AniList.')
    .addStringOption(option => option.setName('username').setDescription('Tên người dùng trên AniList').setRequired(true)),
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
        return interaction.reply(`Không tìm thấy thông tin người dùng: **${username}**`);
      }
      const embed = new MessageEmbed()
        .setTitle(userData.name)
        .setURL(userData.siteUrl)
        .setColor('#C6FFFF')
        .addFields(
          {
            name: 'Đã xem',
            value: `${userData.statistics.anime.count} bộ anime.`,
            inline: true,
          },
          {
            name: 'Đã xem',
            value: `${userData.statistics.anime.minutesWatched} phút.`,
            inline: true,
          },
          {
            name: 'Đã xem',
            value: `${userData.statistics.manga.count} bộ manga.`,
            inline: true,
          },
          {
            name: 'Đã đọc',
            value: `${userData.statistics.manga.chaptersRead} chương.`,
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
