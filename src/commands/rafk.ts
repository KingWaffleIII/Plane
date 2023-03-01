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

import { Question } from "../interfaces";
import rafk from "../RAFK.json";

const wait = require("node:timers/promises").setTimeout;

export const data = new SlashCommandBuilder()
	.setName("rafk")
	.setDescription("Gives you a question about RAFK.")
	.addIntegerOption((option) =>
		option
			.setName("part")
			.setDescription(
				"The part of RAFK you want to be asked about (1-3). Leave blank for a random part."
			)
			.setMinValue(1)
			.setMaxValue(3)
	)
	.addBooleanOption((option) =>
		option
			.setName("random")
			.setDescription(
				"Whether to use a specific RAFK subject or a random question. Leave blank for a random question."
			)
	);

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	const random = interaction.options.getBoolean("random") ?? true;

	await interaction.deferReply();

	// const part =
	// 	interaction.options.getInteger("part") ??
	// 	Math.floor(Math.random() * 3) + 1;
	const part = rafk[1];
	const selectId = crypto.randomBytes(6).toString("hex");

	let subject: {
		[category: string]: Question[];
	} =
		part[
			Object.keys(part)[
				Math.floor(Math.random() * Object.keys(part).length)
			] as keyof typeof part
		];

	if (!random) {
		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-subject-${selectId}`)
					.setPlaceholder("Select a subject")
			);
		for (const subj in part) {
			if (Object.prototype.hasOwnProperty.call(part, subj)) {
				row.components[0].addOptions({
					label: subj,
					value: subj,
				});
			}
		}
		await interaction.editReply({
			components: [row],
		});

		const filter = (i: StringSelectMenuInteraction) =>
			i.customId === `select-subject-${selectId}`;
		const selections = await interaction.channel?.awaitMessageComponent({
			componentType: ComponentType.StringSelect,
			time: 30000,
			filter,
		});
		if (selections) {
			if (selections.user.id !== interaction.user.id) {
				await selections.reply({
					content: "You can't select a subject.",
					ephemeral: true,
				});
			} else {
				subject = part[selections.values[0] as keyof typeof part];
				await selections.deferUpdate();
			}
		}
	}

	const category: Question[] =
		subject[
			Object.keys(subject)[
				Math.floor(Math.random() * Object.keys(subject).length)
			]
		];
	const randomQuestion: Question =
		category[Math.floor(Math.random() * category.length)];

	const { question, answer } = randomQuestion;
	const buttonId = crypto.randomBytes(6).toString("hex");

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`reveal-rafk-${buttonId}`)
			.setLabel("Reveal answer")
			.setStyle(ButtonStyle.Primary)
	);
	await interaction.editReply({
		content: question,
		components: [row],
	});

	const filter = (i: ButtonInteraction) =>
		i.customId === `reveal-rafk-${buttonId}`;
	const collector = interaction.channel?.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 60000,
		filter,
	});
	collector?.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== interaction.user.id) {
			await i.reply({
				content: "You can't reveal this answer.",
				ephemeral: true,
			});
		} else {
			await interaction.editReply({
				content: `${question}\n**${answer}**`,
				components: [],
			});
		}
	});

	await wait(30000);
	await interaction.editReply({
		content: `\n${question}\n**${answer}**`,
		components: [],
	});
}
