const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const language = require("./../../language/language_setup.js");

module.exports = {
  owner: true,
  data: new SlashCommandBuilder()
      .setName("switch_language")
      .setDescription(`${language.__n("language.command_description")}`)
      .addStringOption((option) =>
          option
              .setName("language")
              .setDescription(`${language.__n("language.language_option")}`)
              .setRequired(true)
              .addChoices(
                  { name: "English", value: "en" },
                  { name: "Vietnamese", value: "vi" }
              )
      ),
  async execute(interaction) {
    const languageres = interaction.options.getString("language");
    language.setLocale(languageres);
    const response = language.__n(languageres);

    const embed = new EmbedBuilder()
        .setTitle(`${language.__n("language.language_switch")}`)
        .setDescription(`${language.__n("language.response_language")} ${response}`)
        .setColor("#66ffff");

    await interaction.reply({ embeds: [embed] });
  },
};