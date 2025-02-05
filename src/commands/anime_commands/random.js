const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
const fs = require('fs');
const path = require('path');
const language = require("./../../language/language_setup.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("random")
    .setDescription(`${language.__n("random.command_description")}`),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      const randomPage = Math.floor(Math.random() * 419);// 419 is the last page of the AniList API (update: 2025/02/1)
      console.log(`Random page: ${randomPage}`);
      const variables = { page: randomPage };

      const query = fs.readFileSync(path.join(__dirname, '../../queries/random.graphql'), 'utf8');
      const response = await axios.post("https://graphql.anilist.co", {
        query: query,
        variables: variables,
      }, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        }
      });

      const animeList = response.data.data.Page.media;

      if (!animeList.length) {
        return interaction.editReply(language.__n("global.no_results"));
      }
      const randomAnime = animeList[Math.floor(Math.random() * animeList.length)];

      const restrictedGenres = ["Ecchi", "Hentai"];
      if (randomAnime.genres.some(genre => restrictedGenres.includes(genre))) {
        return interaction.editReply(
          `**${language.__n("global.nsfw_block")} ${randomAnime.title.romaji}**\n${language.__n("global.nsfw_block_reason")}`
        );
      }

      let description = randomAnime.description ? randomAnime.description.replace(/\n*<br>/g, "") : "";
      if (description.length > 600) {
        description = description.slice(0, 600) + "...";
      }

      const embedImage = `https://img.anili.st/media/${randomAnime.id}`;

      const embed = new EmbedBuilder()
        .setTitle(randomAnime.title.romaji)
        .setURL(randomAnime.siteUrl)
        .setDescription(description)
        .setColor("#66FFFF")
        .addFields(
          {
            name: `${language.__n("global.episodes")}`,
            value: `${randomAnime.episodes || language.__n("global.unavailable")}`,
            inline: true,
          },
          {
            name: `${language.__n("global.status")}`,
            value: `${randomAnime.status}`,
            inline: true,
          },
          {
            name: `${language.__n("global.average_score")}`,
            value: `${randomAnime.averageScore}/100`,
            inline: true,
          },
          {
            name: `${language.__n("global.mean_score")}`,
            value: `${randomAnime.meanScore}/100`,
            inline: true,
          },
          {
            name: `${language.__n("global.season")}`,
            value: `${randomAnime.season} - ${randomAnime.startDate.year}`,
            inline: true,
          },
          {
            name: `${language.__n("global.studio")}`,
            value: `${randomAnime.studios.edges.map(edge => edge.node.name).join(", ") || language.__n("global.unavailable")}`,
            inline: true,
          }
        )
        .setImage(embedImage)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error(`${language.__n("global.error")}`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(`${language.__n("global.error_reply")}`);
      } else {
        await interaction.reply(`${language.__n("global.error_reply")}`);
      }
    }
  },
};
