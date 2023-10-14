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
		.setTitle("Plane v1.6.0 'Uchiha Plane Massacre'")
		.setURL("https://github.com/KingWaffleIII/plane")
		.setAuthor({
			name: "KingWaffleIII @ Planet Waffle",
			iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
			url: "https://github.com/KingWaffleIII/",
		})
		.setDescription(
			`
Plane focuses on supplementing RAF cadets' RAFK (RAF Knowledge) and their aircraft recognition skills (especially in preparation for RAST).
\n
__**Known issues/suggestions**__
https://github.com/KingWaffleIII/plane/issues
If you have any issues with the images given for \`/airrec\` and \`/airrec-quiz\`, please understand that these are randomly picked from a website. There is no way to control the quality of the images so if you find a bad image, just try again.
\n
__**Changelog**__
https://github.com/KingWaffleIII/Plane/pulls?q=is%3Apr+is%3Aclosed
See the latest pull request with the current version in its name to see the changelog.
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can submit an issue with the above link or contact me by:
- Discord: kingwaffleiii
- Email: support@planetwaffle.net
\n
__**Credits**__
https://github.com/KingWaffleIII/plane/blob/main/credits.md
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
