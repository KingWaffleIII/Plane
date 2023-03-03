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

import { Aircraft, Waifu, WaifuEmbedData } from "../interfaces";
import airrec from "../air_rec.json";
import waifus from "../waifus.json";

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
	aircraft?: string
): { name: string; urlFriendlyName: string; path: string } | null {
	if (Math.floor(Math.random() * 3) === 0) {
		if (aircraft) {
			if (Object.keys(waifus).includes(aircraft)) {
				const waifu: Waifu = waifus[aircraft as keyof typeof waifus];

				if (waifu.urlFriendlyName) {
					return {
						name: aircraft,
						urlFriendlyName: waifu.urlFriendlyName,
						path: waifu.path,
					};
				}
				return {
					name: aircraft,
					urlFriendlyName: aircraft,
					path: waifu.path,
				};
			}
			return null;
		}

		const nonSpecWaifus = Object.keys(waifus).filter((waifu) => {
			const waifuData = waifus[waifu as keyof typeof waifus];
			return !waifuData.spec;
		});
		const waifuName = nonSpecWaifus[
			Math.floor(Math.random() * Object.keys(nonSpecWaifus).length)
		] as keyof typeof waifus;
		const waifu: Waifu = waifus[waifuName];

		if (waifu.urlFriendlyName) {
			return {
				name: waifuName,
				urlFriendlyName: waifu.urlFriendlyName,
				path: waifu.path,
			};
		}
		return {
			name: waifuName,
			urlFriendlyName: waifuName,
			path: waifu.path,
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
		)
		.setFooter({
			text: "Photo credit: https://www.airfighters.com",
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

		if (aircraft.waifuImage) {
			const waifu: WaifuEmbedData | null = spawnWaifu(
				aircraft.waifuImage
			);
			if (waifu) {
				const waifuEmbed = new EmbedBuilder()
					.setColor(0xff00ff)
					.setTitle(waifu.name)
					.setImage(`attachment://${waifu.urlFriendlyName}.jpg`)
					.setDescription(
						`You can view your waifu collection by using \`/waifus\`!`
					)
					// .addFields({ name: "Name", value: waifu.name, inline: true })
					.setFooter({
						text: "You unlocked an waifu! Image credit: Atamonica",
					});
				await interaction.followUp({
					content: `<@${interaction.user.id}> has unlocked a new waifu!`,
					embeds: [waifuEmbed],
					files: [waifu.path],
				});
			}
		}
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
		if (collected.size === 0) {
			await doReveal();
		}
	});
}
