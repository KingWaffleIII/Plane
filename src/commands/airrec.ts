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

import { Aircraft } from "../interfaces";
import airrec from "../air_rec.json";

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

	const aircraft: Aircraft = type[Math.floor(Math.random() * type.length)];
	const image = await getImage(aircraft.image);
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
		.setImage(image)
		.setTimestamp()
		.setFooter({
			text: "Photo credit: https://www.airfighters.com",
		})
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
		} else {
			await interaction.editReply({
				content: `**The answer was ${aircraft.name}!**`,
				embeds: [answer],
				components: [],
			});
		}
	});

	await wait(30000);
	await interaction.editReply({
		content: `**The answer was ${aircraft.name}!**`,
		embeds: [answer],
		components: [],
	});
}
