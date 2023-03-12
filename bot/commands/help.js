"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("help")
    .setDescription("Information about Plane and how to contact the developer.");
async function execute(interaction) {
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Plane v1.3.2 "Super Galahad"')
        .setURL("https://github.com/KingWaffleIII/plane")
        .setAuthor({
        name: "KingWaffleIII @ PlanetWaffle",
        iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
        url: "https://github.com/KingWaffleIII/",
    })
        .setDescription(`
Plane focuses on supplementing RAF cadets' RAFK (RAF Knowledge) and their aircraft recognition skills (especially in preparation for mRAST).
\n
__**Known issues/suggestions**__
https://github.com/KingWaffleIII/plane/issues
If you have any issues with the images given for \`/airrec\` and \`/airrec-quiz\`, please understand that these are randomly picked from a website. There is no way to control the quality of the images so if you find a bad image, just try again.
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can contact me by:
- Discord: DM me or ping me on a server this bot and I am in.
- Email: support@planetwaffle.net
Please note that simply using the bot counts as a contribution!
\n
__**Credits**__
- **KingWaffleIII#9031** - Lead developer and maintainer
- **ApocalypticTofu#4278** - Lead adviser
- **Cranium#2516** - Adviser and military aircraft recognition tips
- **Green Guy#9990** - "Green"(?) Adviser

- **https://airfighters.com** - Aircraft images
- **Atamonica** - Easter egg images
			`)
        .setThumbnail("https://i.imgur.com/YnUnoQL.png")
        .setTimestamp()
        .setFooter({
        text: "Plane - Help",
        iconURL: "https://i.imgur.com/YnUnoQL.png",
    });
    await interaction.reply({ embeds: [embed] });
}
exports.execute = execute;
