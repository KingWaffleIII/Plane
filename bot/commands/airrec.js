"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = exports.spawnWaifu = exports.getImage = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = require("discord.js");
const air_rec_json_1 = __importDefault(require("../air_rec.json"));
const waifus_json_1 = __importDefault(require("../waifus.json"));
const wait = require("node:timers/promises").setTimeout;
async function getImage(url) {
    try {
        const response = await axios_1.default.get(url);
        const $ = cheerio_1.default.load(response.data);
        const images = [];
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
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
exports.getImage = getImage;
function spawnWaifu(aircraft) {
    if (Math.floor(Math.random() * 1) === 0) {
        if (aircraft) {
            if (Object.keys(waifus_json_1.default).includes(aircraft)) {
                const waifu = waifus_json_1.default[aircraft];
                const path = waifu.path[Math.floor(Math.random() * waifu.path.length)];
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
        const waifuName = Object.keys(waifus_json_1.default)[Math.floor(Math.random() * Object.keys(waifus_json_1.default).length)];
        const waifu = waifus_json_1.default[waifuName];
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
exports.spawnWaifu = spawnWaifu;
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("airrec")
    .setDescription("Gives you an aircraft image for you to identify.")
    .addBooleanOption((option) => option
    .setName("random")
    .setDescription("Whether to show a specific aircraft type or a random aircraft. Leave blank for a random aircraft."))
    .addStringOption((option) => option
    .setName("type")
    .setDescription("The type of aircraft you want to be shown. Leave blank for a random aircraft.")
    .addChoices({ name: "Civilian", value: "civilian" }, { name: "Military", value: "military" }));
async function execute(interaction) {
    const requestedType = interaction.options.getString("type") ?? false;
    await interaction.deferReply();
    let type = air_rec_json_1.default[Object.keys(air_rec_json_1.default)[
    // Math.floor(Math.random() * Object.keys(airrec).length)
    Math.floor(Math.random() * 2) // for some reason there's a key called "default" in the object?? setting max to 2
    ]];
    if (requestedType) {
        type = air_rec_json_1.default[requestedType];
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
            content: "Sorry, I encountered an issue in retrieving an image. Please try again later.",
        });
        return;
    }
    const buttonId = crypto_1.default.randomBytes(6).toString("hex");
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`reveal-airrec-${buttonId}`)
        .setLabel("Reveal answer")
        .setStyle(discord_js_1.ButtonStyle.Primary));
    await interaction.editReply({
        content: `**What is the name of this aircraft?**\n${image}`,
        components: [row],
    });
    const answer = new discord_js_1.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(aircraft.name)
        .setDescription(aircraft.role)
        .setTimestamp()
        .addFields({
        name: "Alternative names (aliases for /airrec-quiz):",
        value: aircraft.aliases.join(", ") || "None",
    }, {
        name: "Aircraft features to help you identify it:",
        value: aircraft.identification
            .map((identification) => `- ${identification}\n`)
            .join("") || "None",
    }, 
    // { name: "\u200B", value: "\u200B" },
    {
        name: "Wikipedia:",
        value: aircraft.wiki,
        inline: true,
    }, {
        name: "See more images:",
        value: aircraft.image,
        inline: true,
    });
    if (waifu) {
        answer.setImage(`attachment://${waifuName}.jpg`).setFooter({
            text: "You found an waifu! Image credit: Atamonica",
        });
    }
    else {
        answer.setImage(image).setFooter({
            text: "Photo credit: https://www.airfighters.com",
        });
    }
    const filter = (i) => i.customId === `reveal-airrec-${buttonId}`;
    const collector = interaction.channel?.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 30000,
        filter,
    });
    collector?.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({
                content: "You can't reveal this answer.",
                ephemeral: true,
            });
        }
        else if (waifu) {
            await interaction.editReply({
                content: `**The answer was ${aircraft.name}!**`,
                embeds: [answer],
                components: [],
                files: [waifuImage],
            });
        }
        else {
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
    }
    else {
        await interaction.editReply({
            content: `**The answer was ${aircraft.name}!**`,
            embeds: [answer],
            components: [],
        });
    }
}
exports.execute = execute;
