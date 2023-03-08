import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models";
import waifus from "../waifus.json";

export const data = new SlashCommandBuilder()
	.setName("target")
	.setDescription("Select a waifu to get from the guarantee system.")
	.addStringOption((option) =>
		option
			.setName("name")
			.setDescription("The name of the waifu you want to target.")
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const name = interaction.options.getString("name")!;

	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (!user) {
		await interaction.editReply({
			content: `You don't have waifu collection yet! Use \`/waifus\` to create one!`,
		});
	}

	const waifusLowerCase = Object.keys(waifus).map((w) => w.toLowerCase());

	if (!waifusLowerCase.includes(name.toLowerCase())) {
		await interaction.editReply({
			content: "That waifu doesn't exist!",
		});
		return;
	}

	const waifuName =
		Object.keys(waifus)[waifusLowerCase.indexOf(name.toLowerCase())];

	if (
		(await user!.countWaifus({
			where: {
				name: waifuName,
			},
		})) > 5
	) {
		await interaction.editReply({
			content: `You already have 5 copies of ${waifuName}!`,
		});
		return;
	}

	await user!.update({
		guaranteeWaifu: waifuName,
		guaranteeCounter: user!.guaranteeCounter ?? 0,
	});
	console.log(`target ${user!.guaranteeCounter}`);

	await interaction.editReply({
		content: `You have successfully targeted ${waifuName}! You will get this waifu within 15 waifus, if not earlier. This has not reset your counter.`,
	});
}
