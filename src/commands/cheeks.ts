import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("cheeks")
	.setDescription(
		'A helpful tip on how to identify the Boeing AH-64 Apache and the Boeing RC-135 "Rivet Joint".'
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	await interaction.reply({
		files: [
			"./assets/cheeks.jpg",
			"./assets/AH-64.jpg",
			"./assets/RC-135.jpg",
		],
	});
}
