import crypto from "crypto";
import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	Message,
	SlashCommandBuilder,
} from "discord.js";

import { Question } from "./rafk";
import rafk from "../RAFK.json";

const wait = require("node:timers/promises").setTimeout;

export const data = new SlashCommandBuilder()
	.setName("rafk-quiz")
	.setDescription(
		"Gives you a series of RAFK questions, similar to a part test."
	)
	.addIntegerOption((option) =>
		option
			.setName("part")
			.setDescription(
				"The part of RAFK you want to be asked about (1-3). Defaults to a random part."
			)
			.setMinValue(1)
			.setMaxValue(3)
	);

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	await interaction.reply({
		content: "Creating a new thread...",
	});

	// const part =
	// 	interaction.options.getInteger("part") ??
	// 	Math.floor(Math.random() * 3) + 1;
	const part = rafk[1];

	const channel = interaction.channel as BaseGuildTextChannel;

	const thread = await channel.threads.create({
		name: `RAFK Part ${1} Quiz`,
		autoArchiveDuration: 60,
		reason: `RAFK Part ${1} Quiz`,
	});

	await interaction.editReply({
		content: "Thread created! Click here:",
	});

	const questions: Question[] = [];

	const doQuestion = async (randomQuestion: Question) =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve) => {
			const { question, answer } = randomQuestion;
			const buttonId = crypto.randomBytes(6).toString("hex");

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`reveal-rafk-${buttonId}`)
					.setLabel("Reveal answer")
					.setStyle(ButtonStyle.Primary)
			);
			const msg = await thread.send({
				content: question,
				components: [row],
			});

			const filter = (i: ButtonInteraction) =>
				i.customId === `reveal-rafk-${buttonId}`;
			const collector = thread.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 10000,
				filter,
			});
			collector?.on("collect", async (i: ButtonInteraction) => {
				if (i.user.id !== interaction.user.id) {
					await i.reply({
						content: "You can't reveal this answer.",
						ephemeral: true,
					});
				} else {
					await msg.edit({
						content: `${question}\n**${answer}**`,
						components: [],
					});

					resolve(true);
				}
			});
			collector?.on("end", async (collected) => {
				if (collected.size === 0) {
					await msg.edit({
						content: `\n${question}\n**${answer}**`,
						components: [],
					});

					resolve(true);
				}
			});
		});

	for (let j = 0; j < Object.keys(part).length; j++) {
		let subject: {
			[category: string]: Question[];
		} = part[Object.keys(part)[j] as keyof typeof part];

		let category: Question[] =
			subject[
				Object.keys(subject)[
					Math.floor(Math.random() * Object.keys(subject).length)
				]
			];

		let randomQuestion: Question =
			category[Math.floor(Math.random() * category.length)];
		if (questions.includes(randomQuestion)) {
			j--;
			continue;
		}
		questions.push(randomQuestion);

		await doQuestion(randomQuestion).then(async () => {
			await wait(3000);
			subject = part[Object.keys(part)[j] as keyof typeof part];

			category =
				subject[
					Object.keys(subject)[
						Math.floor(Math.random() * Object.keys(subject).length)
					]
				];

			randomQuestion =
				category[Math.floor(Math.random() * category.length)];
			if (questions.includes(randomQuestion)) {
				j--;
				return;
			}
			questions.push(randomQuestion);

			await doQuestion(randomQuestion).then(async () => {
				await wait(3000);
			});
		});
	}
}