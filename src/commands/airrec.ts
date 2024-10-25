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
import fs from "fs";

import mrast from "../mrast.json" with { type: "json" };
import rast from "../rast.json" with { type: "json" };

export interface Aircraft {
	readonly aliases: string[];
	readonly identification: string[];
	readonly image: string;
	readonly full: string;
	readonly model: string; // only used for score checking
	readonly name: string;
	readonly role: string;
	readonly wiki: string;
}

export async function getImage(aircraft: Aircraft): Promise<string | null> {
	try {
		if (!fs.existsSync(`cached_images/${aircraft.name}`))
			fs.mkdirSync(`cached_images/${aircraft.name}`, { recursive: true });

		let url = aircraft.image;
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);
		const images: string[] = [];
		let image: string;

		if (url.match(/airfighters.com/)) {
			// get every a element with class pgthumb
			$("a.pgthumb").each((_i, element) => {
				// get the src attribute of the child img element
				const i = $(element).children("img").attr("src");
				if (i) images.push(i);
			});

			image = images[Math.floor(Math.random() * images.length)];
			url = `https://www.airfighters.com/${image.replace("400", "9999")}`;
		} else {
			// jetphotos.com
			$("img.result__photo").each((_i, element) => {
				const i = $(element).attr("src");
				if (i) images.push(i);
			});

			image = images[Math.floor(Math.random() * images.length)];
			url = `http://${image.replace("//", "").replace("400", "full")}`;
		}

		// download the image (not awaited)
		const res = await axios.get(url, {
			responseType: "stream",
		});
		res.data.pipe(
			fs.createWriteStream(
				`cached_images/${aircraft.name}/${image.split("/").pop()}`
			)
		);

		return url;
	} catch (error) {
		console.error(error);
		// check cache
		try {
			const files = fs.readdirSync(`cached_images/${aircraft.name}`);
			if (files.length > 0) {
				return `cached_images/${aircraft.name}/${files[Math.floor(Math.random() * files.length)]}`;
			}
			return null;
		} catch (_error) {
			return null;
		}
	}
}

export function makeEmbedWithImage(img: string, spec: string): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle("What is the name of this aircraft?")
		.setFooter({
			text: `Spec: ${spec} | Photo credit: see bottom of image.`,
		});
	if (img.startsWith("http")) {
		embed.setImage(img);
	} else {
		embed.setImage(`attachment://${img}`);
	}
	return embed;
}

export const data = new SlashCommandBuilder()
	.setName("airrec")
	.setDescription("Gives you an aircraft image for you to identify.")
	.addStringOption((option) =>
		option
			.setName("spec")
			.setDescription(
				"The spec you want to use (mRAST is RAF past/present). Defaults to RAST."
			)
			.addChoices(
				{ name: "mRAST", value: "mRAST" },
				{ name: "RAST", value: "RAST" }
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const spec = interaction.options.getString("spec") ?? "RAST";

	await interaction.deferReply();

	const list: Aircraft[] = spec === "RAST" ? rast : mrast;

	const aircraft = list[Math.floor(Math.random() * list.length)];

	const image = await getImage(aircraft);

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

	const embed = makeEmbedWithImage(image, spec);
	await interaction.editReply({
		embeds: [embed],
		components: [row],
		files: image.startsWith("http") ? [] : [image],
	});

	const answer = new EmbedBuilder()
		.setColor(0x0099ff)
		.setTitle(aircraft.name)
		.setDescription(aircraft.role)
		.addFields(
			{
				name: "Full name:",
				value: aircraft.full,
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
		)
		.setFooter({
			text: `Spec: ${spec} | Photo credit: see bottom of image.`,
		});

	if (image.startsWith("http")) {
		answer.setImage(image);
	} else {
		answer.setImage(`attachment://${image.split("/")[2]}`);
	}

	const filter = (i: ButtonInteraction) =>
		i.customId === `reveal-airrec-${buttonId}`;
	const collector = interaction.channel?.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 30000,
		filter,
	});

	const doReveal = async () => {
		await interaction.editReply({
			content: `**The answer was the ${aircraft.name}!**`,
			embeds: [answer],
			components: [],
			files: image.startsWith("http") ? [] : [image],
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
