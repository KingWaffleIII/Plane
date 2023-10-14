import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { Guild } from "../models.js";

export const data = new SlashCommandBuilder()
	.setName("enable-waifus")
	.setDescription("Enables/disables waifu spawning server-wide.")
	.addBooleanOption((option) =>
		option
			.setName("status")
			.setDescription(
				"Whether to enable or disable waifu spawning. Defaults to enabled."
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const status = interaction.options.getBoolean("status") ?? true;

	await interaction.deferReply();

	const guild = await Guild.findByPk(interaction.guildId!);
	if (!guild) {
		await Guild.create({
			id: interaction.guildId!,
			name: interaction.guild!.name,
			waifusEnabled: status,
		});
	} else {
		await guild.update({
			waifusEnabled: status,
		});
	}

	await interaction.editReply({
		content: `Waifu spawning has been ${status ? "enabled" : "disabled"}.`,
	});
}
