import crypto from "crypto";
import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ComponentType,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";

import { User, Waifu } from "../models";
import waifus from "../waifus.json";

export const data = new SlashCommandBuilder()
	.setName("trade")
	.setDescription("Starts a waifu trade with another user.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user you want to trade with.")
			.setRequired(true)
	)
	.addStringOption((option) =>
		option
			.setName("name")
			.setDescription(
				"The name of the waifu you want to trade (you can select a copy after)."
			)
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const name = interaction.options.getString("name")!;
	const targetUser = interaction.options.getUser("user")!;

	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);
	if (!user) {
		await interaction.followUp({
			content: `**You don't have waifu collection yet! Use \`/waifus\` to create one!**`,
		});
	}

	const targetUserModel = await User.findByPk(targetUser.id);
	if (!targetUserModel) {
		await interaction.followUp({
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

	const userWaifus = await user!.getWaifus({
		where: {
			name: waifuName,
		},
	});
	userWaifus.sort((a, b) => a.atk! - b.atk!).splice(25); // discord only allows 25 items

	let targetUserWaifus = await targetUserModel!.getWaifus();
	targetUserWaifus.sort((a, b) => a.atk! - b.atk!).splice(25); // discord only allows 25 items

	if (userWaifus.length === 0) {
		await interaction.editReply({
			content: `You don't have a copy of ${waifuName}!`,
		});
		return;
	}

	const initialSelectId = crypto.randomBytes(6).toString("hex");
	const initialRow =
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`trade-waifu-${initialSelectId}`)
				.setPlaceholder("Select a copy to trade")
		);

	userWaifus.forEach((waifu) => {
		initialRow.components[0].addOptions({
			label: `ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd}`,
			value: waifu.id!.toString(),
		});
	});

	await interaction.editReply({
		content: `<@${interaction.user.id}>, which copy of ${waifuName} do you want to trade? **You will not be able to confirm after!**`,
		components: [initialRow],
	});

	const initialFilter = (i: StringSelectMenuInteraction) =>
		i.customId === `trade-waifu-${initialSelectId}`;
	const initialCollector =
		interaction.channel!.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			filter: initialFilter,
			time: 30000,
		});

	let initialWaifu: Waifu;
	initialCollector!.on("collect", async (initialI) => {
		if (initialI.user.id !== interaction.user.id) {
			await initialI.reply({
				content: "You can't trade this waifu.",
				ephemeral: true,
			});
			return;
		}

		initialWaifu = (await Waifu.findByPk(initialI.values[0])) as Waifu;
		await initialI.deferUpdate();

		const targetSelectWaifuId = crypto.randomBytes(6).toString("hex");
		const targetSelectWaifuRow =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`trade-waifu-${targetSelectWaifuId}`)
					.setPlaceholder("Select a waifu to trade")
			);

		const waifuList: string[] = [];

		targetUserWaifus.forEach((waifu) => {
			if (!waifuList.includes(waifu.name)) waifuList.push(waifu.name!);
		});

		waifuList.forEach((waifu) => {
			targetSelectWaifuRow.components[0].addOptions({
				label: waifu,
				value: waifu,
			});
		});

		await interaction.editReply({
			content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which waifu do you want to trade? **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
			components: [targetSelectWaifuRow],
		});

		const targetFilter = (select: StringSelectMenuInteraction) =>
			select.customId === `trade-waifu-${targetSelectWaifuId}`;
		const targetCollector =
			interaction.channel!.createMessageComponentCollector({
				componentType: ComponentType.StringSelect,
				filter: targetFilter,
				time: 30000,
			});

		let targetWaifu: Waifu;
		targetCollector!.on("collect", async (targetI) => {
			if (targetI.user.id !== targetUser.id) {
				await targetI.reply({
					content: "You can't trade this waifu.",
					ephemeral: true,
				});
				return;
			}

			await targetI.deferUpdate();

			const targetSelectCopyId = crypto.randomBytes(6).toString("hex");
			const targetSelectCopyRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`trade-waifu-${targetSelectCopyId}`)
						.setPlaceholder("Select a copy to trade")
				);

			targetUserWaifus = await targetUserModel!.getWaifus({
				where: {
					name: targetI.values[0],
				},
			});
			targetUserWaifus.sort((a, b) => a.atk! - b.atk!).splice(25); // discord only allows 25 items

			targetUserWaifus.forEach((waifu) => {
				console.log(
					`ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd}`
				);
				targetSelectCopyRow.components[0].addOptions({
					label: `ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd}`,
					value: waifu.id!.toString(),
				});
			});

			await interaction.editReply({
				content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which copy of ${targetI.values[0]} do you want to trade! **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
				components: [targetSelectCopyRow],
			});

			const finalFilter = (i: StringSelectMenuInteraction) =>
				i.customId === `trade-waifu-${targetSelectCopyId}`;
			const finalCollector =
				interaction.channel!.createMessageComponentCollector({
					componentType: ComponentType.StringSelect,
					filter: finalFilter,
					time: 30000,
				});

			finalCollector!.on("collect", async (finalI) => {
				if (finalI.user.id !== targetUser.id) {
					await finalI.reply({
						content: "You can't trade this waifu.",
						ephemeral: true,
					});
					return;
				}

				await finalI.deferUpdate();

				targetWaifu = (await Waifu.findByPk(finalI.values[0])) as Waifu;

				await user!.removeWaifu(initialWaifu);
				await targetUserModel!.removeWaifu(targetWaifu);
				await user!.addWaifu(targetWaifu);
				await targetUserModel!.addWaifu(initialWaifu);

				await interaction.editReply({
					content: `<@${interaction.user.id}>'s **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})** was traded for <@${targetUser.id}>'s **${targetWaifu.name} (ATK: ${targetWaifu.atk} | HP: ${targetWaifu.hp} | SPD: ${targetWaifu.spd})**!`,
					components: [],
				});
			});

			finalCollector!.on("end", async () => {
				if (finalCollector!.collected.size === 0) {
					await interaction.editReply({
						content: `The trade was cancelled.`,
						components: [],
					});
				}
			});
		});

		targetCollector!.on("end", async () => {
			if (targetCollector!.collected.size === 0) {
				await interaction.editReply({
					content: `The trade was cancelled.`,
					components: [],
				});
			}
		});
	});

	initialCollector!.on("end", async () => {
		if (initialCollector!.collected.size === 0) {
			await interaction.editReply({
				content: `The trade was cancelled.`,
				components: [],
			});
		}
	});
}
