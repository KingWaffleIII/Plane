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

import { User } from "../models";
import airrec from "../air_rec.json";
import waifus from "../waifus.json";

export interface Aircraft {
	readonly name: string;
	readonly role: string;
	readonly manufacturer: string;
	readonly model: string;
	readonly aliases: string[];
	readonly identification: string[];
	readonly image: string;
	readonly waifuImage?: string;
	readonly wiki: string;
}

export interface WaifuBaseData {
	readonly path: string;
	readonly type: string;
	readonly spec: boolean; // if the aircraft is obtainable via /airrec
	readonly urlFriendlyName?: string;
	readonly ability?: string;
	readonly abilityName?: string;
	readonly abilityDescription?: string;
	readonly country?: string;
}

export interface WaifuData extends WaifuBaseData {
	readonly name: string;
	readonly urlFriendlyName: string;
}

export async function getImage(url: string): Promise<string | null> {
	try {
		const response = await axios.get(url);
		const $ = cheerio.load(response.data);
		const images: string[] = [];

		// get every a element with class pgthumb
		$("a.pgthumb").each((_i, element) => {
			// get the src attribute of the child img element
			const image = $(element).children("img").attr("src");
			if (image) images.push(image);
		});

		const image = images[Math.floor(Math.random() * images.length)];
		return `https://www.airfighters.com/${image.replace("400", "9999")}`;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export async function spawnWaifu(
	user: User,
	name?: string
): Promise<WaifuData | null> {
	let isGuaranteed = false;
	if (user.guaranteeWaifu) {
		isGuaranteed =
			user.guaranteeWaifu !== undefined && user.guaranteeCounter! >= 10;
	}
	if (isGuaranteed || Math.floor(Math.random() * 3) === 0) {
		if (
			(isGuaranteed && name === user.guaranteeWaifu) ||
			name === user.guaranteeWaifu
		) {
			await user!.update({
				guaranteeWaifu: null,
				guaranteeCounter: null,
			});
		} else if (user.guaranteeWaifu) {
			await user!.update({
				guaranteeCounter: user.guaranteeCounter! + 1,
			});
		}

		if (name) {
			if (Object.keys(waifus).includes(name)) {
				const waifu: WaifuBaseData =
					waifus[name as keyof typeof waifus];

				if (waifu.urlFriendlyName) {
					return {
						name,
						urlFriendlyName: waifu.urlFriendlyName,
						path: waifu.path,
						type: waifu.type,
						spec: waifu.spec,
						abilityName: waifu.abilityName,
						abilityDescription: waifu.abilityDescription,
					};
				}
				return {
					name,
					urlFriendlyName: name,
					path: waifu.path,
					type: waifu.type,
					spec: waifu.spec,
					abilityName: waifu.abilityName,
					abilityDescription: waifu.abilityDescription,
				};
			}
			return null;
		}

		const nonSpecWaifus = Object.keys(waifus).filter((w) => {
			const waifuData = waifus[w as keyof typeof waifus];
			return !waifuData.spec;
		});
		const waifuName = nonSpecWaifus[
			Math.floor(Math.random() * Object.keys(nonSpecWaifus).length)
		] as keyof typeof waifus;
		const waifu: WaifuBaseData = waifus[waifuName];

		if (waifu.urlFriendlyName) {
			return {
				name: waifuName,
				urlFriendlyName: waifu.urlFriendlyName,
				path: waifu.path,
				type: waifu.type,
				spec: waifu.spec,
				abilityName: waifu.abilityName,
				abilityDescription: waifu.abilityDescription,
			};
		}
		return {
			name: waifuName,
			urlFriendlyName: waifuName,
			path: waifu.path,
			type: waifu.type,
			spec: waifu.spec,
			abilityName: waifu.abilityName,
			abilityDescription: waifu.abilityDescription,
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
				"Whether to show a specific aircraft type or a random aircraft. Defaults to a random aircraft."
			)
	)
	.addStringOption((option) =>
		option
			.setName("type")
			.setDescription(
				"The type of aircraft you want to be shown. Defaults to a random aircraft."
			)
			.addChoices(
				{ name: "Civilian", value: "civilian" },
				{ name: "Military", value: "military" }
			)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const requestedType = interaction.options.getString("type") ?? false;

	await interaction.deferReply();

	const user = await User.findByPk(interaction.user.id);

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

	let aircraft: Aircraft = type[Math.floor(Math.random() * type.length)];

	if (user) {
		if (
			user!.guaranteeWaifu &&
			user!.guaranteeCounter! >= 10 &&
			waifus[user!.guaranteeWaifu! as keyof typeof waifus].spec
		)
			aircraft = type.find(
				(a) => a.waifuImage === user!.guaranteeWaifu!
			)!;
	}

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

		if (user) {
			if (aircraft.waifuImage) {
				const waifu: WaifuData | null = await spawnWaifu(
					user,
					aircraft.waifuImage
				);
				if (waifu) {
					const atk = Math.floor(Math.random() * 10);
					const hp = Math.floor(Math.random() * (100 - 50) + 50);
					const spd = Math.floor(Math.random() * 10);

					const waifuEmbed = new EmbedBuilder()
						.setColor(0xff00ff)
						.setTitle(waifu.name)
						.setImage(`attachment://${waifu.urlFriendlyName}.jpg`)
						.setDescription(
							`You can view your waifu collection by using \`/waifus\`!`
						)
						.addFields(
							{
								name: "ATK",
								value: atk.toString(),
								inline: true,
							},
							{
								name: "HP",
								value: hp.toString(),
								inline: true,
							},
							{
								name: "SPD",
								value: spd.toString(),
								inline: true,
							}
						)
						.setFooter({
							text: "You unlocked an waifu! Image credit: Atamonica",
						});
					await interaction.followUp({
						content: `<@${interaction.user.id}> has unlocked a new waifu!`,
						embeds: [waifuEmbed],
						files: [waifu.path],
					});

					await user.createWaifu({
						name: waifu.name,
						atk,
						hp,
						spd,
						spec: waifu.spec,
						kills: 0,
						deaths: 0,
					});
					user.lockedWaifus! = user.lockedWaifus!.filter(
						(w) => w !== waifu.name
					);
					await user.save();
				}
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
