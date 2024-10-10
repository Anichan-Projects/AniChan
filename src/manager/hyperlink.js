const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const dotenv = require('dotenv');
const language = require('./../language/language_setup.js');
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`${language.__n(`hyperlink.starup_success`)}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const regex = /\[([^\]]+)]\((<?https?:\/\/\S+>?)\)/g;
    let match;
    while ((match = regex.exec(message.content)) !== null) {
        const displayText = match[1];
        const actualLink = match[2].replace(/[<>)]+$/, '').replace(/^<+/, '');

        if (/\.\w/.test(displayText)) {
            const warningEmbed = new EmbedBuilder()
                .setColor('#ebee7e')
                .setTitle(`${language.__n(`hyperlink.title`)}`)
                .setDescription(`${language.__n(`hyperlink.description`)}`)
                .addFields(
                    { name: `${language.__n(`hyperlink.sender`)}`, value: `${message.author.tag} (ID: ${message.author.id})`, inline: true },
                    { name: `${language.__n(`hyperlink.displayer_link`)}`, value: `${displayText}`, inline: true },
                    { name: `${language.__n(`hyperlink.actual_link`)}`, value: `${actualLink}`, inline: true },
                    { name: `${language.__n(`hyperlink.message_link`)}`, value: `[${language.__n(`hyperlink.jump_message`)}](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id})` }
                )
                .setFooter({ text: `${language.__n(`hyperlink.contribute`)}` })
                .setTimestamp();

            const ignoreButton = new ButtonBuilder()
                .setCustomId('ignore')
                .setLabel(`${language.__n(`hyperlink.ignore`)}`)
                .setStyle(ButtonStyle.Success);

            const deleteButton = new ButtonBuilder()
                .setCustomId('delete')
                .setLabel(`${language.__n(`hyperlink.delete`)}`)
                .setStyle(ButtonStyle.Danger)

            const row = new ActionRowBuilder().addComponents(ignoreButton, deleteButton);

            const sentMessage = await message.channel.send({ embeds: [warningEmbed], components: [row] });

            const filter = i => (i.customId === 'ignore' || i.customId === 'delete') && i.user.id === message.author.id;
            const collector = sentMessage.createMessageComponentCollector({ filter, time: 600000 });

            collector.on('collect', async i => {
                if (i.customId === 'ignore') {
                    await sentMessage.delete();
                    await i.reply({ content: `${language.__n(`hyperlink.ignore_description`)}`, ephemeral: true });
                } else if (i.customId === 'delete') {
                    await message.delete();
                    await sentMessage.delete();
                    await i.reply({ content: `${language.__n(`hyperlink.delete_description`)}`, ephemeral: true });
                }
            });

            break;
        }
    }
});

client.login(process.env.BOT_TOKEN).then(() => {});