import crypto from "crypto";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	SlashCommandBuilder,
} from "discord.js";

import rafk from "../rafk.json" assert { type: "json" };
import ranks from "../ranks.json" assert { type: "json" };

export interface Question {
	question?: string;
	image?: string;
	answer: string;
}

export const data = new SlashCommandBuilder()
	.setName("rafk")
	.setDescription("Gives you a question about RAFK.")
	.addStringOption((option) =>
		option
			.setName("topic")
			.setDescription("The topic/part you want to be asked about.")
			.addChoices(
				{ name: "Part 1", value: "1" },
				// { name: "Part 2", value: "2" },
				{ name: "Ranks", value: "ranks" }
			)
			.setRequired(true)
	);

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	const topic = interaction.options.getString("topic")!;

	await interaction.deferReply();

	let part;

	if (topic !== "ranks") {
		part = rafk[topic as keyof typeof rafk];
	} else {
		part = ranks;
	}

	const subject: {
		[category: string]: Question[];
	} =
		part[
			Object.keys(part)[
				Math.floor(Math.random() * Object.keys(part).length)
			] as keyof typeof part
		];

	const category =
		subject[
			Object.keys(subject)[
				Math.floor(Math.random() * Object.keys(subject).length)
			]
		];
	const randomQuestion =
		category[Math.floor(Math.random() * category.length)];

	const buttonId = crypto.randomBytes(6).toString("hex");
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`reveal-rafk-${buttonId}`)
			.setLabel("Reveal answer")
			.setStyle(ButtonStyle.Primary)
	);
	let answer: string;
	if (topic !== "ranks") {
		const { question } = randomQuestion;
		answer = randomQuestion.answer;

		await interaction.editReply({
			content: question,
			components: [row],
		});

		const filter = (i: ButtonInteraction) =>
			i.customId === `reveal-rafk-${buttonId}`;
		const collector = interaction.channel?.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 30000,
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
		collector?.on("end", async (collected) => {
			if (
				collected.filter((i) => i.user.id === interaction.user.id)
					.size === 0
			)
				await interaction.editReply({
					content: `${question}\n**${answer}**`,
					components: [],
				});
		});
	} else {
		const { image } = randomQuestion;
		answer = randomQuestion.answer;

		await interaction.editReply({
			content: "What rank is this?",
			files: [image!],
			components: [row],
		});

		const filter = (i: ButtonInteraction) =>
			i.customId === `reveal-rafk-${buttonId}`;
		const collector = interaction.channel?.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 30000,
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
					content: `**${answer}**`,
					files: [image!],
					components: [],
				});
			}
		});
		collector?.on("end", async (collected) => {
			if (
				collected.filter((i) => i.user.id === interaction.user.id)
					.size === 0
			)
				await interaction.editReply({
					content: `**${answer}**`,
					files: [image!],
					components: [],
				});
		});
	}
}
