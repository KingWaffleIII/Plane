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
    if (Math.floor(Math.random() * 3) === 0) {
        if (aircraft) {
            if (Object.keys(waifus_json_1.default).includes(aircraft)) {
                const waifu = waifus_json_1.default[aircraft];
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
        const nonSpecWaifus = Object.keys(waifus_json_1.default).filter((waifu) => {
            const waifuData = waifus_json_1.default[waifu];
            return !waifuData.spec;
        });
        const waifuName = nonSpecWaifus[Math.floor(Math.random() * Object.keys(nonSpecWaifus).length)];
        const waifu = waifus_json_1.default[waifuName];
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
    const aircraft = type[Math.floor(Math.random() * type.length)];
    const image = await getImage(aircraft.image);
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
        .setImage(image)
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
    })
        .setFooter({
        text: "Photo credit: https://www.airfighters.com",
    });
    const filter = (i) => i.customId === `reveal-airrec-${buttonId}`;
    const collector = interaction.channel?.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
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
            const waifu = spawnWaifu(aircraft.waifuImage);
            if (waifu) {
                const waifuEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0xff00ff)
                    .setTitle(waifu.name)
                    .setImage(`attachment://${waifu.urlFriendlyName}.jpg`)
                    .setDescription(`You can view your waifu collection by using \`/waifus\`!`)
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
    collector?.on("collect", async (i) => {
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
exports.execute = execute;
