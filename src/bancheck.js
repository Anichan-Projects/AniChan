const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const language = require('./language/language_setup');

async function checkBan(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.username;
    const banlistDir = path.join(__dirname, 'banlist');
    const banFilePath = path.join(banlistDir, `${userId}.txt`);

    if (fs.existsSync(banFilePath)) {
        const banData = fs.readFileSync(banFilePath, 'utf8').split(', ');
        const [time, date, reason] = banData;
        const bantime = time +" "+ date;

        const embed = new EmbedBuilder()
            .setTitle(`${language.__n('userban.bantitle')}`)
            .setThumbnail(interaction.user.avatarURL())
            .addFields(
                { name: `${language.__n('userban.username')}`, value: userName, inline: true},
                { name: `${language.__n('userban.uuid')}`, value: userId, inline: true },
                { name: `${language.__n('userban.bantime')}`, value: bantime, inline: true },
                { name: `${language.__n('userban.reason')}`, value: reason || `${language.__n('userban.noreason')}`, inline: true }
            )
            .setFooter({ text: `${language.__n('userban.contact')}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: false });
        return true;
    }
    return false;
}

module.exports = { checkBan };