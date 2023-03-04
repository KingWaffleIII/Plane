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

import rafk from "../RAFK.json";

const wait = require("node:timers/promises").setTimeout;

interface Question {
	question: string;
	answer: string;
}

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
	.addStringOption((option) =>
		option
			.setName("subject")
			.setDescription(
				"The subject you want to be asked about. Leave blank for a random subject."
			)
			.addChoices(
				{ name: "The RAF", value: "The RAF" },
				{ name: "The CCF", value: "The CCF" },
				{ name: "Airmanship", value: "Airmanship" },
				{ name: "Map Reading", value: "Map Reading" }
			)
	);

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	const requestedSubject = interaction.options.getString("subject") ?? false;

	await interaction.deferReply();

	// const part =
	// 	interaction.options.getInteger("part") ??
	// 	Math.floor(Math.random() * 3) + 1;
	const part = rafk[1];

	let subject: {
		[category: string]: Question[];
	} =
		part[
			Object.keys(part)[
				Math.floor(Math.random() * Object.keys(part).length)
			] as keyof typeof part
		];

	if (requestedSubject) {
		subject = part[requestedSubject as keyof typeof part];
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

	await wait(30000);
	await interaction.editReply({
		content: `\n${question}\n**${answer}**`,
		components: [],
	});
}
