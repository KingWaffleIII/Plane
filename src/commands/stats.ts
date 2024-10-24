import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { Guild, User } from "../models.js";
import waifus from "../waifus.json" with { type: "json" };

export const data = new SlashCommandBuilder()
	.setName("stats")
	.setDescription("Get your Plane stats.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription(
				"The user you want to view the stats of. Defaults to you."
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const targetUser = interaction.options.getUser("user") ?? interaction.user;

	await interaction.deferReply();

	const guild = await Guild.findByPk(interaction.guildId!);
	if (!guild) {
		await Guild.create({
			id: interaction.guildId!,
			name: interaction.guild!.name,
			waifusEnabled: false,
		});
	}

	let user = await User.findByPk(targetUser.id);
	if (!user && targetUser.id === interaction.user.id) {
		await User.create({
			id: interaction.user.id,
			username: interaction.user.username,
			avatarUrl: interaction.user.avatarURL(),
			lockedWaifus: Object.keys(waifus),
			dogfightKills: 0,
			dogfightDeaths: 0,
			dogfightWinstreak: 0,
			airrecQuizWins: 0,
			airrecQuizLosses: 0,
			airrecQuizWinstreak: 0,
		});
		user = await User.findByPk(interaction.user.id);
	} else if (!user && targetUser.id !== interaction.user.id) {
		await interaction.editReply({
			content:
				"This user doesn't have a profile yet. They need to use `/waifus` or `/stats` first.",
		});
		return;
	}

	// airrec quizzes
	const { airrecQuizWins, airrecQuizLosses } = user!;
	const quizTotal = airrecQuizWins + airrecQuizLosses;
	const { airrecQuizWinstreak } = user!;

	// dogfights
	const { dogfightKills, dogfightDeaths } = user!;
	const dogfightTotal = dogfightKills + dogfightDeaths;
	const { dogfightWinstreak } = user!;

	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(`${targetUser.username}'s Stats`)
		.setAuthor({
			name: targetUser.username,
			iconURL: targetUser.avatarURL() as string,
		})
		.addFields(
			{
				name: `Airrec Quizzes (${quizTotal})`,
				value: `Wins: ${airrecQuizWins}\nLosses: ${airrecQuizLosses}\nWinstreak: ${airrecQuizWinstreak}`,
			},
			{
				name: `Dogfights (${dogfightTotal})`,
				value: `Kills: ${dogfightKills}\nDeaths: ${dogfightDeaths}\nWinstreak: ${dogfightWinstreak}`,
			}
		)
		.setFooter({
			text: "You can view specific waifu stats with /waifus. If you are the only player (and thus, the winner) in an airrec quiz, it doesn't count towards any stats.",
		});

	await interaction.editReply({ embeds: [embed] });
}
