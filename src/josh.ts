import {
	ActivityType,
	Client,
	Events,
	GatewayIntentBits,
	ThreadChannel,
} from "discord.js";
import { createClient } from "redis";

import { joshToken } from "./config.json";

const wait = require("node:timers/promises").setTimeout;

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	presence: {
		status: "online",
		activities: [
			{
				name: "mRAST",
				type: ActivityType.Competing,
			},
		],
	},
});

const realJoshId = "732584820387086366";
const responses = [
	"I'm better than you",
	"Ur trash",
	"I would roast you but my mom said that I'm not allowed to burn the trash",
	"Ur stupid",
	"Go study airrec",
	"Me >>> you",
];

client.on(Events.ClientReady, (bot) => {
	console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});

client.on(Events.MessageCreate, async (message) => {
	if (
		message.content.includes(`<@${client.user?.id}>`) ||
		message.content.includes(`<@${realJoshId}>`)
	) {
		await message.reply(
			responses[Math.floor(Math.random() * responses.length)]
		);
	}
});

async function listenForQuiz(message: string, channel: string) {
	if (message === "accept") return;

	const thread = (await client.channels.fetch(message)) as ThreadChannel;
	if (thread === null || thread?.archived) return;

	if (channel !== "josh-new-quiz") return;

	if (message === "end") {
		await thread.send(
			responses[Math.floor(Math.random() * responses.length)]
		);
		return;
	}

	const doQuiz = async (m: string, c: string) => {
		if (c !== "josh-do-quiz" || m === "end") return;

		await wait(8000);
		await thread.send(m);
		await thread.send(
			responses[Math.floor(Math.random() * responses.length)]
		);
	};

	const pub = createClient({
		url: "redis://plane_redis:6379",
	});
	pub.on("error", (err) => console.error(err));
	await pub.connect();
	if (Math.floor(Math.random() * 10) === 1) {
		await wait(3000);
		await pub.publish("josh-new-quiz", "accept");
		await thread.send(
			responses[Math.floor(Math.random() * responses.length)]
		);
	} else {
		return;
	}

	const sub = pub.duplicate();
	sub.on("error", (err) => console.error(err));
	await sub.connect();
	await sub.subscribe("josh-do-quiz", doQuiz);
}

(async () => {
	await client.login(joshToken);

	const sub = createClient({
		url: "redis://plane_redis:6379",
	});
	sub.on("error", (err) => console.error(err));
	await sub.connect();

	await sub.subscribe("josh-new-quiz", listenForQuiz);
})();
