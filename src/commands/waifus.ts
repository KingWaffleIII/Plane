import crypto from "crypto";
import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";
import { Guild, User } from "../models";
import { Waifu } from "./airrec";
import waifus from "../waifus.json";

export const data = new SlashCommandBuilder()
	.setName("waifus")
	.setDescription("View your waifu collection.")
	.addBooleanOption((option) =>
		option
			.setName("select")
			.setDescription(
				"Whether or not you want to pick a waifu you've unlocked or see your general collection."
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const select = interaction.options.getBoolean("select") ?? false;

	await interaction.deferReply();

	const guild = await Guild.findByPk(interaction.guildId as string);
	let user = await User.findByPk(interaction.user.id);
	if (!user) {
		await guild!.createUser({
			id: interaction.user.id,
			username: interaction.user.username,
		});
		user = await User.findByPk(interaction.user.id);
	}

	const specWaifus = Object.keys(waifus).filter((w) => {
		const waifuData = waifus[w as keyof typeof waifus];
		return waifuData!.spec;
	});
	const nonSpecWaifus = Object.keys(waifus).filter((w) => {
		const waifuData = waifus[w as keyof typeof waifus];
		return !waifuData!.spec;
	});
	const unlockedSpecWaifus = specWaifus.filter((w) =>
		user!.unlockedWaifus!.includes(w)
	);
	const unlockedNonSpecWaifus = nonSpecWaifus.filter((w) =>
		user!.unlockedWaifus!.includes(w)
	);

	if (select) {
		const selectId = crypto.randomBytes(12).toString("hex");
		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-waifu-${selectId}`)
					.setPlaceholder("Select a waifu")
			);
		user!.unlockedWaifus!.forEach((waifu) => {
			row.components[0].addOptions({
				label: waifu,
				value: waifu,
			});
		});
		await interaction.editReply({
			components: [row],
		});

		const filter = (i: StringSelectMenuInteraction) =>
			i.customId === `select-waifu-${selectId}`;
		const selections = await interaction.channel?.awaitMessageComponent({
			componentType: ComponentType.StringSelect,
			time: 30000,
			filter,
		});

		let waifu: string | null = null;
		let waifuData: Waifu | null = null;

		if (selections) {
			if (selections.user.id !== interaction.user.id) {
				await selections.reply({
					content: "You can't select a waifu.",
					ephemeral: true,
				});
			} else {
				// eslint-disable-next-line prefer-destructuring
				waifu = selections.values[0];
				waifuData! =
					waifus[selections.values[0] as keyof typeof waifus];
				await selections.deferUpdate();
			}
		}

		if (!user!.unlockedWaifus!.includes(waifu as string)) {
			if (waifuData!.spec) {
				await interaction.editReply({
					content:
						"You don't have this waifu unlocked! You can unlock her by using `/airrec`.",
				});
				return;
			}
			await interaction.editReply({
				content:
					"You don't have this waifu unlocked! You can unlock her by winning airrec quizzes.",
			});
			return;
		}

		console.log(waifuData!.urlFriendlyName, waifuData!.path);
		const waifuEmbed = new EmbedBuilder()
			.setColor(0xff00ff)
			.setTitle(waifu)
			.setImage(`attachment://${waifuData!.urlFriendlyName ?? waifu}.jpg`)
			.setFooter({
				text: `You can unlock ${
					specWaifus.length - unlockedSpecWaifus.length
				} more waifus with /airrec and ${
					nonSpecWaifus.length - unlockedNonSpecWaifus.length
				} more waifus by winning airrec quizzes!`,
			});
		if (waifuData!.spec) {
			waifuEmbed.setDescription(
				"You unlocked this waifu with `/airrec`!"
			);
		} else {
			waifuEmbed.setDescription(
				"You unlocked this waifu by winning an airrec quiz!"
			);
		}

		await interaction.editReply({
			embeds: [waifuEmbed],
			files: [waifuData!.path],
			components: [],
		});

		return;
	}

	const embed = new EmbedBuilder()
		.setColor(0xff00ff)
		.setTitle(`${interaction.user.username}'s Waifu Collection`)
		.setAuthor({
			name: interaction.user.username,
			iconURL: interaction.user.avatarURL() as string,
		})
		.setThumbnail(interaction.user.avatarURL() as string)
		.setDescription(
			`You have ${user!.unlockedWaifus!.length}/${
				Object.keys(waifus).length
			} waifus unlocked!`
		)
		.addFields(
			{
				name: "Unlocked Waifus",
				value: user!.unlockedWaifus!.join(", ") || "None",
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
				specWaifus.length - unlockedSpecWaifus.length
			} more waifus with /airrec and ${
				nonSpecWaifus.length - unlockedNonSpecWaifus.length
			} more waifus by winning airrec quizzes!`,
		});

	await interaction.editReply({
		embeds: [embed],
	});
}
