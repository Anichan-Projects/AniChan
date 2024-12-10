const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const language = require('./../../language/language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
      .setName('user')
      .setDescription(`${language.__n('user.command_description')}`)
      .addStringOption(option => option.setName('username').setDescription(`${language.__n('user.user_name')}`).setRequired(true)),
  async execute(interaction) {
    try {
      await interaction.deferReply();

      const username = interaction.options.getString('username');
      const query = fs.readFileSync(path.join(__dirname, '../../queries/user.graphql'), 'utf8');

      const response = await axios.post('https://graphql.anilist.co', {
        query: query,
        variables: { username }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      const data = response.data;
      const userData = data.data.User;

      const userImage = `https://img.anili.st/user/${userData.id}`;
      if (!userData) {
        return interaction.editReply(`${language.__n('global.no_results')}: **${username}**`);
      }

      const embed = new EmbedBuilder()
          .setTitle(`${userData.name}'s infomation`)
          .setURL(userData.siteUrl)
          .setColor('#C6FFFF')
          .addFields(
              {
                name: `${language.__n('user.anime_count')}`,
                value: `${userData.statistics.anime.count} ${language.__n('user.anime_count')}.`,
                inline: true,
              },
              {
                name: `${language.__n('user.minutes_watched')}`,
                value: `${userData.statistics.anime.minutesWatched} ${language.__n('user.minutes_watched')}`,
                inline: true,
              },
              {
                name: `${language.__n('user.manga_count')}`,
                value: `${userData.statistics.manga.count} ${language.__n('user.manga_count')}.`,
                inline: true,
              },
              {
                name: `${language.__n('user.chapters_read')}`,
                value: `${userData.statistics.manga.chaptersRead} ${language.__n('user.chapters_read')}.`,
                inline: true,
              }
          )
          .setImage(userImage)
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