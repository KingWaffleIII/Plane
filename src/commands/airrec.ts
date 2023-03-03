import axios from "axios";
import cheerio from "cheerio";
import crypto from "crypto";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { Aircraft, Waifu } from "../interfaces";
import airrec from "../air_rec.json";
import waifus from "../waifus.json";

const wait = require("node:timers/promises").setTimeout;

export async function getImage(url: string): Promise<string | null> {
	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);
		const images: string[] = [];

		// get every a element with class pgthumb
		$("a.pgthumb").each((i, element) => {
			// get the src attribute of the child img element
			const image = $(element).children("img").attr("src");
			if (image) {
				images.push(image);
			}
		});

		const image = images[Math.floor(Math.random() * images.length)];
		return `https://www.airfighters.com/${image.replace("400", "9999")}`;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export function spawnWaifu(
	aircraft: string | null
): { urlFriendlyName: string; path: string } | null {
	if (Math.floor(Math.random() * 1) === 0) {
		if (aircraft) {
			if (Object.keys(waifus).includes(aircraft)) {
				const waifu: Waifu = waifus[aircraft as keyof typeof waifus];
				const path =
					waifu.path[Math.floor(Math.random() * waifu.path.length)];

				if (waifu.urlFriendlyName) {
					return {
						urlFriendlyName: waifu.urlFriendlyName,
						path,
					};
				}
				return { urlFriendlyName: aircraft, path };
			}
			return null;
		}

		const waifuName = Object.keys(waifus)[
			Math.floor(Math.random() * Object.keys(waifus).length)
		] as keyof typeof waifus;
		const waifu: Waifu = waifus[waifuName];
		const path = waifu.path[Math.floor(Math.random() * waifu.path.length)];

		if (waifu.urlFriendlyName) {
			return {
				urlFriendlyName: waifu.urlFriendlyName,
				path,
			};
		}
		return {
			urlFriendlyName: waifuName,
			path,
		};
	}
	return null;
}

export const data = new SlashCommandBuilder()
	.setName("airrec")
	.setDescription("Gives you an aircraft image for you to identify.")
	.addBooleanOption((option) =>
		option
			.setName("random")
			.setDescription(
				"Whether to show a specific aircraft type or a random aircraft. Leave blank for a random aircraft."
			)
	)
	.addStringOption((option) =>
		option
			.setName("type")
			.setDescription(
				"The type of aircraft you want to be shown. Leave blank for a random aircraft."
			)
			.addChoices(
				{ name: "Civilian", value: "civilian" },
				{ name: "Military", value: "military" }
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const requestedType = interaction.options.getString("type") ?? false;

	await interaction.deferReply();

	let type: Aircraft[] =
		airrec[
			Object.keys(airrec)[
				// Math.floor(Math.random() * Object.keys(airrec).length)
				Math.floor(Math.random() * 2) // for some reason there's a key called "default" in the object?? setting max to 2
			] as keyof typeof airrec
		];

	if (requestedType) {
		type = airrec[requestedType as keyof typeof airrec];
	}

	// const aircraft: Aircraft = type[Math.floor(Math.random() * type.length)];
	const aircraft = {
		name: "Fairchild Republic A-10 Thunderbolt II",
		role: "Close air support attack aircraft.",
		manufacturer: "Fairchild Republic",
		model: "A-10",
		aliases: ["Thunderbolt II", "Thunderbolt", "Warthog", "A10", "A 10"],
		identification: [
			"Big gun in nose of plane",
			"Big af like James and they both have 30mm cannons",
			"Rectangular straight wings",
			"Wheels visible on wings even when folded",
			"2 engines on top of the airframe",
			"Vertical stabilisers are outside the elevators and situated on the tip of them",
		],
		image: "https://www.airfighters.com/photosearch.php?cra=1470",
		waifuImage: "Warthog",
		wiki: "https://en.wikipedia.org/wiki/Fairchild_Republic_A-10_Thunderbolt_II",
	};
	const image = await getImage(aircraft.image);

	let waifu = false;
	let waifuName = "";
	let waifuImage = "";
	if (aircraft.waifuImage) {
		const doSpawnWaifu = spawnWaifu(aircraft.waifuImage);
		if (doSpawnWaifu) {
			waifu = true;
			waifuName = doSpawnWaifu.urlFriendlyName;
			waifuImage = doSpawnWaifu.path;
		}
	}

	if (!image) {
		await interaction.editReply({
			content:
				"Sorry, I encountered an issue in retrieving an image. Please try again later.",
		});
		return;
	}

	const buttonId = crypto.randomBytes(6).toString("hex");
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`reveal-airrec-${buttonId}`)
			.setLabel("Reveal answer")
			.setStyle(ButtonStyle.Primary)
	);

	await interaction.editReply({
		content: `**What is the name of this aircraft?**\n${image}`,
		components: [row],
	});

	const answer = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(aircraft.name)
		.setDescription(aircraft.role)
		.setTimestamp()
		.addFields(
			{
				name: "Alternative names (aliases for /airrec-quiz):",
				value: aircraft.aliases.join(", ") || "None",
			},
			{
				name: "Aircraft features to help you identify it:",
				value:
					aircraft.identification
						.map(
							(identification: string) => `- ${identification}\n`
						)
						.join("") || "None",
			},
			// { name: "\u200B", value: "\u200B" },
			{
				name: "Wikipedia:",
				value: aircraft.wiki,
				inline: true,
			},
			{
				name: "See more images:",
				value: aircraft.image,
				inline: true,
			}
		);

	if (waifu) {
		answer.setImage(`attachment://${waifuName}.jpg`).setFooter({
			text: "You found an waifu! Image credit: Atamonica",
		});
	} else {
		answer.setImage(image).setFooter({
			text: "Photo credit: https://www.airfighters.com",
		});
	}

	const filter = (i: ButtonInteraction) =>
		i.customId === `reveal-airrec-${buttonId}`;
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
		} else if (waifu) {
			await interaction.editReply({
				content: `**The answer was ${aircraft.name}!**`,
				embeds: [answer],
				components: [],
				files: [waifuImage],
			});
		} else {
			await interaction.editReply({
				content: `**The answer was ${aircraft.name}!**`,
				embeds: [answer],
				components: [],
			});
		}
	});

	await wait(30000);
	if (waifu) {
		await interaction.editReply({
			content: `**The answer was ${aircraft.name}!**`,
			embeds: [answer],
			components: [],
			files: [waifuImage],
		});
	} else {
		await interaction.editReply({
			content: `**The answer was ${aircraft.name}!**`,
			embeds: [answer],
			components: [],
		});
	}
}
