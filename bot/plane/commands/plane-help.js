"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("plane-help")
        .setDescription("Information about Plane and how to contact the developer."),
    async execute(interaction) {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Plane v1.1.1")
            .setURL("https://github.com/KingWaffleIII/plane")
            .setAuthor({
            name: "KingWaffleIII#8408 @ Planet Waffle",
            iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
            url: "https://github.com/KingWaffleIII/plane",
        })
            .setDescription(`
Plane focuses on supplementing RAF cadets' RAFK (RAF Knowledge) and their aircraft recognition skills (especially in preparation for mRAST).
\n
__**Known issues/suggestions**__
https://github.com/KingWaffleIII/plane/issues
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can contact me by:
- Discord: DM me or ping me on a server this bot and I am in.
- Email: support@planetwaffle.net
Please note that simply using the bot counts as a contribution!
			`)
            .setThumbnail("https://i.imgur.com/YnUnoQL.png")
            .setTimestamp()
            .setFooter({
            text: "Plane - Help",
            iconURL: "https://i.imgur.com/YnUnoQL.png",
        });
        await interaction.reply({ embeds: [embed] });
    },
};
