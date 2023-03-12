import {
	ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";

import { Aircraft, getImage } from "./airrec";
import airrec from "../air_rec.json";

function checkMatch(matchAgainst: string, aircraft: Aircraft): Aircraft | null {
	if (aircraft.name.toLowerCase().includes(matchAgainst)) {
		return aircraft;
	}
	if (
		aircraft.aliases.some((alias) =>
			alias.toLowerCase().includes(matchAgainst)
		)
	) {
		return aircraft;
	}
	return null;
}

export const data = new SlashCommandBuilder()
	.setName("search")
	.setDescription("Search for and view and aircraft profile.")
	.addStringOption((option) =>
		option
			.setName("name")
			.setDescription(
				"The name of the aircraft you want to search for. Use the aircraft model (e.g. F-22)"
			)
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const name = interaction.options.getString("name")!.toLowerCase() ?? false;

	await interaction.deferReply();

	const civilianAircraft = airrec.civilian;
	const militaryAircraft = airrec.military;

	let match = false;
	let matchedAircraft: Aircraft | null = null;
	civilianAircraft.forEach((aircraft) => {
		const result = checkMatch(name, aircraft);
		if (result) {
			match = true;
			matchedAircraft = result;
		}
	});
	militaryAircraft.forEach((aircraft) => {
		const result = checkMatch(name, aircraft);
		if (result) {
			match = true;
			matchedAircraft = result;
		}
	});

	if (!match) {
		await interaction.editReply({
			content: "No aircraft matched your search.",
		});
	} else {
		const image = await getImage(matchedAircraft!.image);

		const embed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle(matchedAircraft!.name)
			.setDescription(matchedAircraft!.role)
			.setImage(image)
			.setTimestamp()
			.addFields(
				{
					name: "Alternative names (aliases for /airrec-quiz):",
					value: matchedAircraft!.aliases.join(", ") || "None",
				},
				{
					name: "Aircraft features to help you identify it:",
					value:
						matchedAircraft!.identification
							.map(
								(identification: string) =>
									`- ${identification}\n`
							)
							.join("") || "None",
				},
				// { name: "\u200B", value: "\u200B" },
				{
					name: "Wikipedia:",
					value: matchedAircraft!.wiki,
					inline: true,
				},
				{
					name: "See more images:",
					value: matchedAircraft!.image,
					inline: true,
				}
			)
			.setFooter({
				text: "Photo credit: https://www.airfighters.com",
			});

		await interaction.editReply({
			content: `**Match found!**`,
			embeds: [embed],
		});
	}
}
