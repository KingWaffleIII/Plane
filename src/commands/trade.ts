import crypto from "crypto";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";

import { User, Waifu } from "../models";

export const data = new SlashCommandBuilder()
	.setName("trade")
	.setDescription("Starts a waifu trade with another user.")
	.addUserOption((option) =>
		option
			.setName("user")
			.setDescription("The user you want to trade with.")
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const targetUser = interaction.options.getUser("user")!;

	await interaction.deferReply();

	const initialUserModel = await User.findByPk(interaction.user.id);
	const targetUserModel = await User.findByPk(targetUser.id);
	if (!initialUserModel || !targetUserModel) {
		await interaction.followUp({
			content:
				"Either you or the user you want to trade with don't have profiles yet. Use `/waifus` or `/stats` first.",
		});
		return;
	}

	let initialUserWaifus = (await initialUserModel!.getWaifus())
		.sort((a, b) => b.atk! - a.atk!)
		.splice(0, 25); // discord only allows 25 items
	let initialWaifu: Waifu;

	let targetUserWaifus = (await targetUserModel!.getWaifus())
		.sort((a, b) => b.atk! - a.atk!)
		.splice(0, 25); // discord only allows 25 items
	let targetWaifu: Waifu;

	if (initialUserWaifus.length === 0 || targetUserWaifus.length === 0) {
		await interaction.followUp({
			content:
				"Either you or the user you want to trade with don't have waifus to dogfight with! Get collecting with `/airrec` and `/airrec-quiz`!",
		});
		return;
	}

	const initialWaifuSelectId = crypto.randomBytes(6).toString("hex");
	const initialWaifuSelectRow =
		new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId(`trade-select-waifu-${initialWaifuSelectId}`)
				.setPlaceholder("Select a waifu to trade")
		);

	const initialWaifuList: string[] = [];

	initialUserWaifus.forEach((waifu) => {
		if (!initialWaifuList.includes(waifu.name))
			initialWaifuList.push(waifu.name!);
	});

	initialWaifuList.forEach((waifu) => {
		initialWaifuSelectRow.components[0].addOptions({
			label: waifu,
			value: waifu,
		});
	});

	await interaction.editReply({
		content: `<@${interaction.user.id}>, which waifu do you want to trade? **You will be able to confirm after.**`,
		components: [initialWaifuSelectRow],
	});

	const initialWaifuSelectFilter = (i: StringSelectMenuInteraction) =>
		i.customId === `trade-select-waifu-${initialWaifuSelectId}`;
	const initialWaifuSelectCollector =
		interaction.channel!.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			filter: initialWaifuSelectFilter,
			time: 30000,
		});

	initialWaifuSelectCollector!.on(
		"collect",
		async (initialWaifuSelectInteraction) => {
			if (initialWaifuSelectInteraction.user.id !== interaction.user.id) {
				await initialWaifuSelectInteraction.reply({
					content: "You can't select this waifu.",
					ephemeral: true,
				});
				return;
			}

			await initialWaifuSelectInteraction.deferUpdate();

			const initialCopySelectId = crypto.randomBytes(6).toString("hex");
			const initialCopySelectRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`trade-select-copy-${initialCopySelectId}`)
						.setPlaceholder("Select a copy to trade")
				);

			initialUserWaifus = (
				await initialUserModel!.getWaifus({
					where: {
						name: initialWaifuSelectInteraction.values[0],
					},
				})
			)
				.sort((a, b) => b.atk! - a.atk!)
				.splice(0, 25); // discord only allows 25 items

			initialUserWaifus.forEach((waifu) => {
				initialCopySelectRow.components[0].addOptions({
					label: `${waifu.name} (ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd})`,
					value: waifu.id!.toString(),
				});
			});

			await interaction.editReply({
				content: `<@${interaction.user.id}>, which copy of **${initialWaifuSelectInteraction.values[0]}** do you want to trade? **You will be able to confirm after.**`,
				components: [initialCopySelectRow],
			});

			const initialCopySelectFilter = (i: StringSelectMenuInteraction) =>
				i.customId === `trade-select-copy-${initialCopySelectId}`;
			const initialCopySelectCollector =
				interaction.channel!.createMessageComponentCollector({
					componentType: ComponentType.StringSelect,
					filter: initialCopySelectFilter,
					time: 30000,
				});

			initialCopySelectCollector!.on(
				"collect",
				async (initialCopySelectInteraction) => {
					if (
						initialCopySelectInteraction.user.id !==
						interaction.user.id
					) {
						await initialCopySelectInteraction.reply({
							content: "You can't select this waifu.",
							ephemeral: true,
						});
						return;
					}

					await initialCopySelectInteraction.deferUpdate();

					initialWaifu = (await Waifu.findByPk(
						initialCopySelectInteraction.values[0]
					)) as Waifu;

					const targetWaifuSelectId = crypto
						.randomBytes(6)
						.toString("hex");
					const targetWaifuSelectRow =
						new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
							new StringSelectMenuBuilder()
								.setCustomId(
									`trade-select-waifu-${targetWaifuSelectId}`
								)
								.setPlaceholder("Select a waifu to trade")
						);

					const targetWaifuList: string[] = [];

					targetUserWaifus.forEach((waifu) => {
						if (!targetWaifuList.includes(waifu.name))
							targetWaifuList.push(waifu.name!);
					});

					targetWaifuList.forEach((waifu) => {
						targetWaifuSelectRow.components[0].addOptions({
							label: waifu,
							value: waifu,
						});
					});

					await interaction.editReply({
						content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which waifu do you want to trade? **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
						components: [targetWaifuSelectRow],
					});

					const targetWaifuSelectFilter = (
						select: StringSelectMenuInteraction
					) =>
						select.customId ===
						`trade-select-waifu-${targetWaifuSelectId}`;
					const targetWaifuSelectCollector =
						interaction.channel!.createMessageComponentCollector({
							componentType: ComponentType.StringSelect,
							filter: targetWaifuSelectFilter,
							time: 30000,
						});

					targetWaifuSelectCollector!.on(
						"collect",
						async (targetWaifuSelectInteraction) => {
							if (
								targetWaifuSelectInteraction.user.id !==
								targetUser.id
							) {
								await targetWaifuSelectInteraction.reply({
									content: "You can't select this waifu.",
									ephemeral: true,
								});
								return;
							}

							await targetWaifuSelectInteraction.deferUpdate();

							const targetCopySelectId = crypto
								.randomBytes(6)
								.toString("hex");
							const targetCopySelectRow =
								new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
									new StringSelectMenuBuilder()
										.setCustomId(
											`trade-select-copy-${targetCopySelectId}`
										)
										.setPlaceholder(
											"Select a copy to trade"
										)
								);

							targetUserWaifus = (
								await targetUserModel!.getWaifus({
									where: {
										name: targetWaifuSelectInteraction
											.values[0],
									},
								})
							)
								.sort((a, b) => b.atk! - a.atk!)
								.splice(0, 25); // discord only allows 25 items

							targetUserWaifus.forEach((waifu) => {
								targetCopySelectRow.components[0].addOptions({
									label: `${waifu.name} (ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd})`,
									value: waifu.id!.toString(),
								});
							});

							await interaction.editReply({
								content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which copy of **${targetWaifuSelectInteraction.values[0]}** do you want to trade? **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
								components: [targetCopySelectRow],
							});

							const targetCopySelectFilter = (
								i: StringSelectMenuInteraction
							) =>
								i.customId ===
								`trade-select-copy-${targetCopySelectId}`;
							const targetCopySelectCollector =
								interaction.channel!.createMessageComponentCollector(
									{
										componentType:
											ComponentType.StringSelect,
										filter: targetCopySelectFilter,
										time: 30000,
									}
								);

							targetCopySelectCollector!.on(
								"collect",
								async (targetCopySelectInteraction) => {
									if (
										targetCopySelectInteraction.user.id !==
										targetUser.id
									) {
										await targetCopySelectInteraction.reply(
											{
												content:
													"You can't select this waifu.",
												ephemeral: true,
											}
										);
									}
									await targetCopySelectInteraction.deferUpdate();

									targetWaifu = (await Waifu.findByPk(
										targetCopySelectInteraction.values[0]
									)) as Waifu;

									const confirmTradeId = crypto
										.randomBytes(6)
										.toString("hex");
									const confirmTradeRow =
										new ActionRowBuilder<ButtonBuilder>().addComponents(
											new ButtonBuilder()
												.setCustomId(
													`trade-confirm-${confirmTradeId}`
												)
												.setLabel("Confirm")
												.setStyle(ButtonStyle.Success),
											new ButtonBuilder()
												.setCustomId(
													`trade-cancel-${confirmTradeId}`
												)
												.setLabel("Cancel")
												.setStyle(ButtonStyle.Danger)
										);

									await interaction.editReply({
										content: `<@${interaction.user.id}>, <@${targetUser.id}> wants to trade **${targetWaifu.name} (ATK: ${targetWaifu.atk} | HP: ${targetWaifu.hp} | SPD: ${targetWaifu.spd})** for **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Do you want to confirm this trade? **This is irreversible!**`,
										components: [confirmTradeRow],
									});

									const confirmTradeFilter = (
										i: ButtonInteraction
									) =>
										i.customId ===
											`trade-confirm-${confirmTradeId}` ||
										i.customId ===
											`trade-cancel-${confirmTradeId}`;

									const confirmTradeCollector =
										interaction.channel!.createMessageComponentCollector(
											{
												componentType:
													ComponentType.Button,
												filter: confirmTradeFilter,
												time: 30000,
											}
										);

									confirmTradeCollector!.on(
										"collect",
										async (confirmTradeInteraction) => {
											if (
												confirmTradeInteraction.user
													.id !== interaction.user.id
											) {
												await confirmTradeInteraction.reply(
													{
														content:
															"You can't confirm this trade.",
														ephemeral: true,
													}
												);
												return;
											}

											await confirmTradeInteraction.deferUpdate();

											if (
												confirmTradeInteraction.customId ===
												`trade-confirm-${confirmTradeId}`
											) {
												await initialUserModel!.removeWaifu(
													initialWaifu
												);
												await targetUserModel!.removeWaifu(
													targetWaifu
												);
												await initialUserModel!.addWaifu(
													targetWaifu
												);
												await targetUserModel!.addWaifu(
													initialWaifu
												);

												await interaction.editReply({
													content: `<@${interaction.user.id}> has successfully traded their **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})** for <@${targetUser.id}>'s **${targetWaifu.name} (ATK: ${targetWaifu.atk} | HP: ${targetWaifu.hp} | SPD: ${targetWaifu.spd})**!`,
													components: [],
												});

												confirmTradeCollector!.stop();
												targetCopySelectCollector!.stop();
												targetWaifuSelectCollector!.stop();
												initialCopySelectCollector!.stop();
												initialWaifuSelectCollector!.stop();
											} else {
												await interaction.editReply({
													content:
														"This trade has been cancelled.",
													components: [],
												});

												confirmTradeCollector!.stop();
												targetCopySelectCollector!.stop();
												targetWaifuSelectCollector!.stop();
												initialCopySelectCollector!.stop();
												initialWaifuSelectCollector!.stop();
											}
										}
									);

									confirmTradeCollector!.on(
										"end",
										async (collected) => {
											if (collected.size === 0) {
												await interaction.editReply({
													content:
														"This trade has been cancelled.",
													components: [],
												});
											}
										}
									);
								}
							);

							targetCopySelectCollector!.on(
								"end",
								async (collected) => {
									if (collected.size === 0) {
										await interaction.editReply({
											content:
												"This trade has been cancelled.",
											components: [],
										});
									}
								}
							);
						}
					);

					targetWaifuSelectCollector!.on("end", async (collected) => {
						if (collected.size === 0) {
							await interaction.editReply({
								content: "This trade has been cancelled.",
								components: [],
							});
						}
					});
				}
			);

			initialCopySelectCollector!.on("end", async (collected) => {
				if (collected.size === 0) {
					await interaction.editReply({
						content: "This trade has been cancelled.",
						components: [],
					});
				}
			});
		}
	);

	initialWaifuSelectCollector!.on("end", async (collected) => {
		if (collected.size === 0) {
			await interaction.editReply({
				content: "This trade has been cancelled.",
				components: [],
			});
		}
	});
}
