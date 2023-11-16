import {
	BaseGuildTextChannel,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";

import { Question } from "./rafk.js";
import rafk from "../rafk.json" assert { type: "json" };
import ranks from "../ranks.json" assert { type: "json" };

const wait = (await import("node:timers/promises")).setTimeout;

// stop crashing if thread is deleted pre-emptively
process.on("unhandledRejection", (_error: Error) => {
	// assume it's because the thread was deleted
	console.error("Thread was deleted before it could finish.");
});

interface RafkPart {
	[subject: string]: {
		[category: string]: Question[];
	};
}

export const data = new SlashCommandBuilder()
	.setName("rafk-quiz")
	.setDescription(
		"Gives you a series of RAFK questions, similar to a part test."
	)
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
	)
	.addIntegerOption((option) =>
		option
			.setName("questions")
			.setDescription(
				"The number of questions you want to be asked. Defaults to 10."
			)
	);

export async function execute(
	interaction: ChatInputCommandInteraction
): Promise<void> {
	const topic = interaction.options.getString("topic")!;
	const rounds = interaction.options.getInteger("questions") ?? 10;

	const name = topic === "ranks" ? "Ranks" : `Part ${topic}`;

	await interaction.reply({
		content: "Creating a new thread...",
	});

	let part: typeof ranks | RafkPart;

	if (topic !== "ranks") {
		part = rafk[topic as keyof typeof rafk];
	} else {
		part = ranks;
	}

	const channel = interaction.channel as BaseGuildTextChannel;

	const thread = await channel.threads.create({
		name: `RAFK ${name} Quiz`,
		autoArchiveDuration: 60,
		reason: `RAFK Part ${name} Quiz`,
	});

	await interaction.editReply({
		content: "Thread created! Click here:",
	});

	await thread.send({
		content: `
__**RAFK Part ${name} Quiz**__
You will be given ${rounds} questions about ${
			topic === "ranks" ? "ranks" : `Part ${topic}`
		}. You will have 10 seconds to answer each question. Good luck!

**Starting in 15 seconds...**
		`,
	});

	await wait(15000);

	const questions: Question[] = [];

	const doQuestion = async (randomQuestion: Question) =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise(async (resolve) => {
			// check if question is Question or RankQuestion
			if ("image" in randomQuestion) {
				const { image, answer } = randomQuestion;

				const msg = await thread.send({
					content:
						"What rank is this?\n**The answer will be revealed in 10 seconds...**",
					files: [image!],
				});

				await wait(10000);

				await msg.reply({
					content: `**The answer was ${answer}!**\nContinuing in 10 seconds...`,
					files: [image!],
				});
			} else {
				const { question, answer } = randomQuestion;

				const msg = await thread.send({
					content: `${question}\n**The answer will be revealed in 10 seconds...**`,
				});

				await wait(10000);

				await msg.reply({
					content: `${question}\n**${answer}**\nContinuing in 10 seconds...`,
				});
			}

			resolve(true);
		});

	for (let j = 0; j < rounds; j++) {
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
		if (questions.includes(randomQuestion)) {
			j--;
			continue;
		}
		questions.push(randomQuestion);

		await doQuestion(randomQuestion);
		await wait(10000);
	}

	await thread.send("The quiz has ended!");
	await thread.setArchived(true);
}
