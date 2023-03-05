import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { User } from "../models";
import { WaifuBaseData } from "./airrec";
import waifus from "../waifus.json";

export const data = new SlashCommandBuilder()
	.setName("gen-waifu")
	.setDescription("Generate a waifu.")
	.setDefaultMemberPermissions(8)
	.addStringOption((option) =>
		option
			.setName("name")
			.setDescription("The name of the waifu you want to generate.")
			.setRequired(true)
	)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription(
				"The user to generate a waifu for. Defaults to you."
			)
	)
	.addIntegerOption((option) =>
		option
			.setName("amount")
			.setDescription(
				"The amount of waifus you want to generate (max (including existing dupes) is 25). Defaults to 1."
			)
	)
	.addIntegerOption((option) =>
		option
			.setName("atk")
			.setDescription(
				"The ATK stat of the waifu to generate. Defaults to RNG."
			)
	)
	.addIntegerOption((option) =>
		option
			.setName("hp")
			.setDescription(
				"The HP stat of the waifu to generate (only for aircraft). Defaults to RNG."
			)
	)
	.addIntegerOption((option) =>
		option
			.setName("spd")
			.setDescription(
				"The SPD stat of the waifu to generate (only for aircraft). Defaults to RNG."
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const targetUser = interaction.options.getUser("user") ?? interaction.user;
	const name = interaction.options.getString("name")!;
	const amount = interaction.options.getInteger("amount") ?? 1;
	const atk = interaction.options.getInteger("atk") ?? null;
	const hp = interaction.options.getInteger("hp") ?? null;
	const spd = interaction.options.getInteger("spd") ?? null;

	await interaction.reply({
		content: "Generating waifu...",
		ephemeral: true,
	});

	const user = await User.findByPk(targetUser.id);
	if (!user) {
		await interaction.editReply({
			content:
				"This user doesn't have a waifu collection yet. They need to run `/waifus` first.",
		});
		return;
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

	const waifuData: WaifuBaseData = waifus[waifuName as keyof typeof waifus];

	for (let i = 0; i < amount; i++) {
		const thisAtk = atk ?? Math.floor(Math.random() * 10);
		let thisHp = hp ?? Math.floor(Math.random() * 20);
		let thisSpd = spd ?? Math.floor(Math.random() * 10);

		if (waifuData.type === "weapon") {
			thisHp = 0;
			thisSpd = 0;
		}

		await user.createWaifu({
			name: waifuName,
			spec: waifuData.spec,
			atk: thisAtk,
			hp: thisHp,
			spd: thisSpd,
			generated: true,
		});
	}

	await interaction.editReply({
		content: `Successfully generated ${amount} ${waifuName} waifu(s) (use \`/waifus user:${targetUser}\`) for ${targetUser.username}!`,
	});
}
