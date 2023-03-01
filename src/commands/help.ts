import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("help")
	.setDescription(
		"Information about Plane and how to contact the developer."
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("Plane v1.2.0")
		.setURL("https://github.com/KingWaffleIII/plane")
		.setAuthor({
			name: "KingWaffleIII @ PlanetWaffle",
			iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
			url: "https://github.com/KingWaffleIII/",
		})
		.setDescription(
			`
Plane focuses on supplementing RAF cadets' RAFK (RAF Knowledge) and their aircraft recognition skills (especially in preparation for mRAST).
\n
__**Known issues/suggestions**__
https://github.com/KingWaffleIII/plane/issues
If you have any issues with the images given for \`/airrec\` and \`/airrec-quiz\`, please understand that these are randomly picked from a website.
There is no way to control the quality of the images so if you find a bad image, just try again.
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can contact me by:
- Discord: DM me or ping me on a server this bot and I am in.
- Email: support@planetwaffle.net
Please note that simply using the bot counts as a contribution!
			`
		)
		.setThumbnail("https://i.imgur.com/YnUnoQL.png")
		.setTimestamp()
		.setFooter({
			text: "Plane - Help",
			iconURL: "https://i.imgur.com/YnUnoQL.png",
		});

	await interaction.reply({ embeds: [embed] });
}