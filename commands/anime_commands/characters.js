const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const language = require('../../language_setup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('characters')
    .setDescription(`${language.__n(`character.command_description`)}`)
    .addStringOption(option => option.setName('name').setDescription(`${language.__n(`character.character_name`)}`).setRequired(true)),
  async execute(interaction) {
    const characterName = interaction.options.getString('name');

    try {
      const query = `
        query ($search: String) {
          Character(search: $search) {
            id
            siteUrl
            name {
              full
            }
            image {
              large
            }
            description
            media {
              nodes {
                title {
                  romaji
                }
              }
            }
          }
        }
      `;

      const response = await axios.post('https://graphql.anilist.co', {
        query,
        variables: { search: characterName },
      });

      const characterData = response.data.data.Character;
      if (!characterData) {
        return interaction.reply(`${language.__n(`global.no_results`)} **${characterName}**`);
      }

      let description = characterData.description || `${language.__n(`global.no_description`)}`;

      const embed = new MessageEmbed()
        .setTitle(characterData.name.full)
        .setURL(characterData.siteUrl)
        .setDescription(description)
        .addFields({ name: `${language.__n(`character.anime_appearances`)}`, value: characterData.media.nodes.map(node => node.title.romaji).join(', ') || `${language.__n(`global.no_results`)}` })
        .setImage(characterData.image.large)
        .setColor('#C6FFFF')
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`${language.__n(`global.error`)}`, error.response);
      interaction.reply(`${language.__n(`global.error_reply`)}`);
    }
  },
};
