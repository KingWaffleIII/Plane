import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("cheeks")
	.setDescription(
		"A helpful tip on how to identify the Boeing AH-64 Apache helicopter and the Boeing RC-135."
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.reply({
		files: [
			"./assets/cheeks.jpg",
			"./assets/apache.jpg",
			"./assets/rc135.jpg",
		],
	});
}
