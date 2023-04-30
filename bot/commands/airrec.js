/* eslint-disable no-param-reassign */
import axios from "axios";
import cheerio from "cheerio";
import crypto from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder, } from "discord.js";
import { User } from "../models.js";
import airrec from "../air_rec.json" assert { type: "json" };
import waifus from "../waifus.json" assert { type: "json" };
export async function getImage(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const images = [];
        // get every a element with class pgthumb
        $("a.pgthumb").each((_i, element) => {
            // get the src attribute of the child img element
            const image = $(element).children("img").attr("src");
            if (image)
                images.push(image);
        });
        const image = images[Math.floor(Math.random() * images.length)];
        return `https://www.airfighters.com/${image.replace("400", "9999")}`;
    }
    catch (error) {
        console.error(error);
        return null;
    }
}
export function makeEmbedWithImage(img) {
    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("What is the name of this aircraft?")
        .setImage(img)
        .setTimestamp()
        .setFooter({
        text: "Photo credit: https://www.airfighters.com",
    });
}
async function spawnWaifu(user, name) {
    let isGuaranteed = false;
    if (user.guaranteeWaifu) {
        isGuaranteed =
            user.guaranteeWaifu !== undefined && user.guaranteeCounter >= 10;
    }
    if (isGuaranteed || Math.floor(Math.random() * 3) === 0) {
        if (name === user.guaranteeWaifu) {
            await user.update({
                guaranteeWaifu: null,
                guaranteeCounter: null,
            });
        }
        else if (user.guaranteeWaifu) {
            if (user.guaranteeCounter < 10) {
                await user.update({
                    guaranteeCounter: user.guaranteeCounter + 1,
                });
            }
        }
        if (Object.keys(waifus).includes(name)) {
            const waifu = waifus[name];
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
    return null;
}
export const data = new SlashCommandBuilder()
    .setName("airrec")
    .setDescription("Gives you an aircraft image for you to identify.")
    .addBooleanOption((option) => option
    .setName("random")
    .setDescription("Whether to show a specific aircraft type or a random aircraft. Defaults to a random aircraft."))
    .addStringOption((option) => option
    .setName("type")
    .setDescription("The type of aircraft you want to be shown. Defaults to a random aircraft.")
    .addChoices({ name: "Civilian", value: "civilian" }, { name: "Military", value: "military" }));
export async function execute(interaction) {
    const requestedType = interaction.options.getString("type") ?? false;
    await interaction.deferReply();
    const user = await User.findByPk(interaction.user.id);
    let type = airrec[Object.keys(airrec)[
    // Math.floor(Math.random() * Object.keys(airrec).length)
    Math.floor(Math.random() * 2) // for some reason there's a key called "default" in the object?? setting max to 2
    ]];
    if (requestedType) {
        type = airrec[requestedType];
    }
    let aircraft = type[Math.floor(Math.random() * type.length)];
    if (user) {
        if (user.guaranteeWaifu &&
            user.guaranteeCounter >= 10 &&
            waifus[user.guaranteeWaifu].spec)
            aircraft = type.find((a) => a.waifuImage === user.guaranteeWaifu);
    }
    const image = await getImage(aircraft.image);
    if (!image) {
        await interaction.editReply({
            content: "Sorry, I encountered an issue in retrieving an image. Please try again later.",
        });
        return;
    }
    const buttonId = crypto.randomBytes(6).toString("hex");
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`reveal-airrec-${buttonId}`)
        .setLabel("Revenal answer")
        .setStyle(ButtonStyle.Primary));
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
                const waifu = await spawnWaifu(user, aircraft.waifuImage);
                if (waifu) {
                    const atk = Math.floor(Math.random() * 10);
                    const hp = Math.floor(Math.random() * (100 - 50) + 50);
                    const spd = Math.floor(Math.random() * 10);
                    const waifuEmbed = new EmbedBuilder()
                        .setColor(0xff00ff)
                        .setTitle(waifu.name)
                        .setImage(`attachment://${waifu.urlFriendlyName}.jpg`)
                        .setDescription(`You can view your waifu collection by using \`/waifus\`!`)
                        .addFields({
                        name: "ATK",
                        value: atk.toString(),
                        inline: true,
                    }, {
                        name: "HP",
                        value: hp.toString(),
                        inline: true,
                    }, {
                        name: "SPD",
                        value: spd.toString(),
                        inline: true,
                    })
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
                    user.lockedWaifus = user.lockedWaifus.filter((w) => w !== waifu.name);
                    await user.save();
                }
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
