import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("plane-help")
		.setDescription(
			"Information about the Plane plugin and how to contact the developer."
		),
	async execute(interaction: ChatInputCommandInteraction) {
		const embed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle("Plane v0.1.0")
			.setURL("https://planetwaffle.net/plane/")
			.setAuthor({
				name: "KingWaffleIII#8408 @ Planet Waffle",
				iconURL: "https://i.imgur.com/TMhlCMb.jpeg",
				url: "https://planetwaffle.net/",
			})
			.setDescription(
				`
Plane is a plugin for the Plane bot. It focuses on supplementing RAF cadets' knowledge (especially in preparation for (M)RAST).
It currently supports quizzing the user on their RAFK (RAF Knowledge) and provides a list of RAFK questions.
**Please note that Plane is in early access and is not yet complete.**
\n
__**Source list**__
- RAFK Part 1 Revision Booklet by Cpl Jheet: https://planetwaffle.net/docs/15/Part_1.pdf
- MRAST Air Recce Revision Booklet by LCpl Mathews: https://planetwaffle.net/docs/14/Mini_AST_Air_Recce_revision_booklet.pdf
\n
__**Roadmap and known issues/suggestions**__
https://gist.github.com/KingWaffleIII/298c39caae02e0ed78eebc314f757817
\n
__**Contributing**__
The bot is maintianed by me only so any help with questions and sources are always appeciated!
If you have any questions, suggestions or find an error, you can contact me by:
- Discord: DM me or ping me on a server this bot and I am in.
- Email: support@planetwaffle.net
- GitHub: leave a comment on the link to the roadmap above.
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
	},
};
