import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getImage } from "./airrec.js";
import mrast from "../mrast.json" assert { type: "json" };
import rast from "../rast.json" assert { type: "json" };
function checkMatch(matchAgainst, aircraft) {
    if (matchAgainst.toLowerCase().includes(aircraft.name.toLowerCase())) {
        return aircraft;
    }
    if (matchAgainst.toLowerCase().includes(aircraft.model.toLowerCase())) {
        return aircraft;
    }
    if (aircraft.aliases.some((alias) => matchAgainst.toLowerCase().includes(alias.toLowerCase()))) {
        return aircraft;
    }
    return null;
}
export const data = new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for and view and aircraft profile.")
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name/alias/model/etc. of the aircraft you want to search for (e.g. F-22 or Raptor).")
    .setRequired(true));
export async function execute(interaction) {
    const name = interaction.options.getString("name").toLowerCase();
    await interaction.deferReply();
    let match = false;
    let matchedAircraft = null;
    for (const aircraft of mrast) {
        const result = checkMatch(name, aircraft);
        if (result) {
            match = true;
            matchedAircraft = result;
            break;
        }
    }
    if (!match) {
        for (const aircraft of rast) {
            const result = checkMatch(name, aircraft);
            if (result) {
                match = true;
                matchedAircraft = result;
                break;
            }
        }
    }
    if (!match) {
        await interaction.editReply({
            content: "No aircraft matched your search.",
        });
    }
    else {
        const image = await getImage(matchedAircraft.image);
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(matchedAircraft.name)
            .setDescription(matchedAircraft.role)
            .setImage(image)
            .addFields({
            name: "Full name:",
            value: matchedAircraft.full,
        }, {
            name: "Alternative names (aliases for /airrec-quiz):",
            value: matchedAircraft.aliases.join(", ") || "None",
        }, {
            name: "Aircraft features to help you identify it:",
            value: matchedAircraft.identification
                .map((identification) => `- ${identification}\n`)
                .join("") || "None",
        }, 
        // { name: "\u200B", value: "\u200B" },
        {
            name: "Wikipedia:",
            value: matchedAircraft.wiki,
            inline: true,
        }, {
            name: "See more images:",
            value: matchedAircraft.image,
            inline: true,
        })
            .setFooter({
            text: "Photo credit: https://www.airfighters.com",
        });
        await interaction.editReply({
            embeds: [embed],
        });
    }
}
