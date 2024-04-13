/* eslint-disable no-param-reassign */
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

import mrast from "../mrast.json" assert { type: "json" };
import rast from "../rast.json" assert { type: "json" };

export interface Aircraft {
	readonly name: string;
	readonly role: string;
	readonly manufacturer: string;
	readonly model: string;
	readonly aliases: string[];
	readonly identification: string[];
	readonly image: string;
	readonly wiki: string;
}

export async function getImage(url: string): Promise<string | null> {
	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);
		const images: string[] = [];

		if (url.match(/airfighters.com/)) {
			// get every a element with class pgthumb
			$("a.pgthumb").each((_i, element) => {
				// get the src attribute of the child img element
				const image = $(element).children("img").attr("src");
				if (image) images.push(image);
			});

			const image = images[Math.floor(Math.random() * images.length)];
			return `https://www.airfighters.com/${image.replace(
				"400",
				"9999",
			)}`;
		}
		// jetphotos.com
		$("img.result__photo").each((_i, element) => {
			const image = $(element).attr("src");
			if (image) images.push(image);
		});

		const image = images[Math.floor(Math.random() * images.length)];
		return `http://${image.replace("//", "").replace("400", "full")}`;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export function makeEmbedWithImage(img: string): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("What is the name of this aircraft?")
		.setImage(img)
		.setTimestamp()
		.setFooter({
			text: "Photo credit: see bottom of image.",
		});
}

export const data = new SlashCommandBuilder()
	.setName("airrec")
	.setDescription("Gives you an aircraft image for you to identify.")
	.addStringOption((option) =>
		option
			.setName("spec")
			.setDescription(
				"The spec you want to use (mRAST is RAF past/present). Defaults to mRAST.",
			)
			.addChoices(
				{ name: "mRAST", value: "mRAST" },
				{ name: "RAST", value: "RAST" },
			),
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const spec = interaction.options.getString("spec") ?? "mRAST";

	await interaction.deferReply();

	const list: Aircraft[] = spec === "RAST" ? rast : mrast;

	const aircraft = list[Math.floor(Math.random() * list.length)];

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
			.setStyle(ButtonStyle.Primary),
	);

	const embed = makeEmbedWithImage(image);
	await interaction.editReply({
		embeds: [embed],
		components: [row],
	});

	const answer = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(aircraft.name)
		.setDescription(aircraft.role)
		.setImage(image)
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
							(identification: string) => `- ${identification}\n`,
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
			},
		)
		.setFooter({
			text: "Photo credit: see bottom of image.",
		});

	const filter = (i: ButtonInteraction) =>
		i.customId === `reveal-airrec-${buttonId}`;
	const collector = interaction.channel?.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 30000,
		filter,
	});

	const doReveal = async () => {
		await interaction.editReply({
			content: `**The answer was ${aircraft.name}!**`,
			embeds: [answer],
			components: [],
		});
	};

	collector?.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== interaction.user.id) {
			await i.reply({
				content: "You can't reveal this answer.",
				ephemeral: true,
			});
			return;
		}
		await doReveal();
	});
	collector?.on("end", async (collected) => {
		if (
			collected.filter((i) => i.user.id === interaction.user.id).size ===
			0
		)
			await doReveal();
	});
}
