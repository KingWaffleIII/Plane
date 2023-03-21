import crypto from "crypto";
import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	SlashCommandBuilder,
} from "discord.js";
import { createClient, RedisClientType } from "redis";

import { Question } from "./rafk";
import rafk from "../RAFK.json";

const wait = require("node:timers/promises").setTimeout;

const joshId = "1084882617964441610";
const joshUsername = "J0sh";

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

	let isJoshOnline = false;
	try {
		const conn = createClient({
			url: "redis://host.docker.internal:6379",
		});
		await conn.connect();
		isJoshOnline = true;
	} catch (err) {
		isJoshOnline = false;
	}

	let isJoshParticipating = false;
	let pub: RedisClientType;
	if (isJoshOnline) {
		const listener = async (m: string, c: string) => {
			if (c !== "josh-new-quiz" || m !== "accept") return;

			isJoshParticipating = true;

			await thread.send({
				content: `<@${joshId}> has joined the game!`,
			});
		};

		pub = createClient({
			url: "redis://host.docker.internal:6379",
		});
		pub.on("error", (err) => console.error(err));
		const sub = pub.duplicate();
		sub.on("error", (err) => console.error(err));
		await sub.connect();
		await sub.subscribe("josh-new-quiz", listener);
		await pub.connect();
		await pub.publish("josh-new-quiz", thread.id);
	}

	await thread.send({
		content: `
__**RAFK Part ${1} Quiz**__
You will be given 2 questions from each category in Part ${1} of RAFK. You will have 15 seconds to answer each question. Good luck!

**Starting in 30 seconds...**
		`,
	});

	await wait(30000);

	const questions: Question[] = [];

	const doQuestion = async (randomQuestion: Question) =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve) => {
			const { question, answer } = randomQuestion;

			const msg = await thread.send({
				content: `${question}\n**The answer will be revealed in 10 seconds...**`,
			});

			if (isJoshParticipating) await pub!.publish("josh-do-quiz", answer);

			await wait(15000);

			await msg.edit({
				content: `${question}\n**${answer}**`,
			});

			resolve(true);
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

	if (isJoshParticipating) await pub!.publish("josh-do-quiz", "end");

	await thread.setArchived(true);
}
