import axios from "axios";
import * as cheerio from "cheerio";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";

import * as airrec from "../air_rec.json";

const crypto = require("crypto");

export interface Aircraft {
	readonly name: string;
	readonly role: string;
	readonly manufacturer: string;
	readonly model: string;
	readonly aliases: string[];
	readonly summary: string;
	readonly identification: string[];
	readonly image: string;
	readonly wiki: string;
}

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
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const random = interaction.options.getBoolean("random") ?? true;

	await interaction.deferReply();

	let type: Aircraft[] =
		airrec[
			Object.keys(airrec)[
				// Math.floor(Math.random() * Object.keys(airrec).length)
				Math.floor(Math.random() * 2) // for some reason there's a key called "default" in the object?? setting max to 2
			] as keyof typeof airrec
		];

	if (!random) {
		const selectId = crypto.randomBytes(12).toString("hex");
		const row =
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`select-type-${selectId}`)
					.setPlaceholder("Select a type")
			);
		for (const aircraftType in airrec) {
			if (aircraftType === "military" || aircraftType === "civilian") {
				row.components[0].addOptions({
					label:
						aircraftType.charAt(0).toUpperCase() +
						aircraftType.slice(1),
					value:
						aircraftType.charAt(0).toUpperCase() +
						aircraftType.slice(1),
				});
			}
		}
		await interaction.editReply({
			components: [row],
		});

		const filter = (i: StringSelectMenuInteraction) =>
			i.customId === `select-type-${selectId}`;
		const selections = await interaction.channel?.awaitMessageComponent({
			componentType: ComponentType.StringSelect,
			time: 60000,
			filter,
		});
		if (selections) {
			if (selections.user.id !== interaction.user.id) {
				await selections.reply({
					content: "You can't select a type.",
					ephemeral: true,
				});
			} else {
				type =
					airrec[
						selections.values[0].toLowerCase() as keyof typeof airrec
					];
				await selections.deferUpdate();
			}
		}
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

	const buttonId = crypto.randomBytes(12).toString("hex");
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

	const filter = (i: ButtonInteraction) =>
		i.customId === `reveal-airrec-${buttonId}`;
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

			await interaction.editReply({
				content: `**The answer was ${aircraft.name}!**`,
				embeds: [answer],
				components: [],
			});
		}
	});
}
