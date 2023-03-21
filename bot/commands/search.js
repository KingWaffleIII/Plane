"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const airrec_1 = require("./airrec");
const air_rec_json_1 = __importDefault(require("../air_rec.json"));
function checkMatch(matchAgainst, aircraft) {
    if (aircraft.name.toLowerCase().includes(matchAgainst)) {
        return aircraft;
    }
    if (aircraft.aliases.some((alias) => alias.toLowerCase().includes(matchAgainst))) {
        return aircraft;
    }
    return null;
}
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for and view and aircraft profile.")
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name/alias/model/etc. of the aircraft you want to search for (e.g. F-22 or Raptor).")
    .setRequired(true));
async function execute(interaction) {
    const name = interaction.options.getString("name").toLowerCase() ?? false;
    await interaction.deferReply();
    const civilianAircraft = air_rec_json_1.default.civilian;
    const militaryAircraft = air_rec_json_1.default.military;
    let match = false;
    let matchedAircraft = null;
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
    }
    else {
        const image = await (0, airrec_1.getImage)(matchedAircraft.image);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(matchedAircraft.name)
            .setDescription(matchedAircraft.role)
            .setImage(image)
            .setTimestamp()
            .addFields({
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
exports.execute = execute;
