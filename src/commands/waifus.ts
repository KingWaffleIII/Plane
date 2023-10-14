import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { Guild, User, Waifu } from "../models.js";
import { WaifuBaseData } from "./airrecQuiz.js";
import waifus from "../waifus.json" assert { type: "json" };

export const data = new SlashCommandBuilder()
	.setName("waifus")
	.setDescription("View your waifu collection.")
	.addStringOption((option) =>
		option
			.setName("name")
			.setDescription(
				"The name of the waifu you want to view. Defaults to all your waifus."
			)
	)
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription(
				"The user to view the waifu collection of. Defaults to you."
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const name = interaction.options.getString("name") ?? null;
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

	let user = await User.findByPk(targetUser.id, {
		include: { model: Waifu, as: "waifus" },
	});
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

	const waifuNames = Object.keys(waifus);
	const unlockedWaifus: string[] = [];
	user!.waifus?.forEach((w) => {
		if (w.generated) return;
		unlockedWaifus.push(w.name);
	});

	if (name) {
		const waifusLowerCase = Object.keys(waifus).map((w) => w.toLowerCase());

		if (!waifusLowerCase.includes(name.toLowerCase())) {
			await interaction.editReply({
				content: "That waifu doesn't exist!",
			});
			return;
		}

		const waifuName =
			Object.keys(waifus)[waifusLowerCase.indexOf(name.toLowerCase())];

		const waifuData: WaifuBaseData =
			waifus[waifuName as keyof typeof waifus];

		const userWaifus = await user!.getWaifus({
			where: {
				name: waifuName,
			},
		});

		if (userWaifus.length === 0) {
			await interaction.editReply({
				content:
					"You don't have this waifu unlocked! You can unlock her by winning airrec quizzes.",
			});
			return;
		}

		const won = userWaifus.reduce((acc, w) => acc + w.kills, 0);
		const lost = userWaifus.reduce((acc, w) => acc + w.deaths, 0);

		const waifuEmbed = new EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle(waifuName)
			.setTimestamp()
			.setAuthor({
				name: targetUser.username,
				iconURL: targetUser.avatarURL() as string,
			})
			.setThumbnail(targetUser.avatarURL() as string)
			.setImage(
				`attachment://${waifuData!.urlFriendlyName ?? waifuName}.jpg`
			)
			.setFooter({
				text: `You can unlock ${
					waifuNames.length - unlockedWaifus.length
				} more waifus by winning airrec quizzes!`,
			})
			.setDescription(
				`
This user has ${userWaifus.length} cop${
					userWaifus.length === 1 ? "y" : "ies"
				} of this waifu!\n
${
	userWaifus.some((w) => w.generated)
		? "One or more of this waifu was generated."
		: ""
}${
					userWaifus.some((w) => !w.generated)
						? "One or more of this waifu was unlocked by winning an airrec quiz!"
						: ""
				}
In dogfighting, this waifu has won ${won} time${
					won === 1 ? "" : "s"
				} and lost ${lost} time${lost === 1 ? "" : "s"}.
			`
			);

		userWaifus.forEach((w) => {
			waifuEmbed.addFields({
				name: `Copy #${userWaifus.indexOf(w) + 1}`,
				value: `ATK: ${w.atk}\nHP: ${w.hp}\nSPD: ${w.spd}\n`,
				inline: true,
			});
		});

		if (waifuData.ability) {
			waifuEmbed.addFields({
				name: waifuData.abilityName!,
				value: waifuData.abilityDescription!,
			});
		}

		await interaction.editReply({
			embeds: [waifuEmbed],
			files: [waifuData!.path],
			components: [],
		});

		return;
	}

	const waifuCopies: {
		[name: string]: number;
	} = {};
	const waifuList: string[] = [];

	const userWaifus = await user!.getWaifus();

	userWaifus.forEach((w) => {
		if (w.generated) {
			if (!waifuList.includes(`\\*${w.name}`)) {
				waifuList.push(`\\*${w.name}`);
				waifuCopies[w.name] = 1;
			} else {
				waifuCopies[w.name]++;
			}
		} else if (!waifuList.includes(w.name)) {
			waifuList.push(w.name);
			waifuCopies[w.name] = 1;
		} else {
			waifuCopies[w.name]++;
		}
	});

	const embed = new EmbedBuilder()
		.setColor(0xff00ff)
		.setTitle(`${targetUser.username}'s Waifu Collection`)
		.setAuthor({
			name: targetUser.username,
			iconURL: targetUser.avatarURL() as string,
		})
		.setThumbnail(targetUser.avatarURL() as string)
		.setDescription(
			`You have **${waifuList.filter((w) => !w.includes("\\*")).length}/${
				Object.keys(waifus).length
			}** waifus unlocked! ${
				user!.guaranteeWaifu
					? `You need to obtain **${
							10 - user!.guaranteeCounter!
					  }** more waifu(s) before you get a guaranteed **${user!
							.guaranteeWaifu!}**.`
					: "You are not currently targetting a waifu."
			}`
		)
		.addFields(
			{
				name: "Unlocked Waifus",
				value:
					waifuList
						.map(
							(w) =>
								`**${w} (${
									waifuCopies[w.replace("\\*", "")]
								})**`
						)
						.join(", ") || "None",
				inline: true,
			},
			{
				name: "Locked Waifus",
				value: user!.lockedWaifus!.join(", ") || "None",
				inline: true,
			}
		)
		.setFooter({
			text: `You can unlock ${
				waifuNames.length - unlockedWaifus.length
			} more waifus by winning airrec quizzes!`,
		});

	await interaction.editReply({
		embeds: [embed],
	});
}
