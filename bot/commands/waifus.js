"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
const waifus_json_1 = __importDefault(require("../waifus.json"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("waifus")
    .setDescription("View your waifu collection.")
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name of the waifu you want to view. Defaults to all your waifus."))
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user to view the waifu collection of. Defaults to you."));
async function execute(interaction) {
    const name = interaction.options.getString("name") ?? null;
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    await interaction.deferReply();
    const guild = await models_1.Guild.findByPk(interaction.guildId);
    let user = await models_1.User.findByPk(targetUser.id, {
        include: { model: models_1.Waifu, as: "waifus" },
    });
    if (!user && targetUser.id === interaction.user.id) {
        await guild.createUser({
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator,
            avatarUrl: interaction.user.avatarURL(),
            kills: 0,
            deaths: 0,
        });
        user = await models_1.User.findByPk(interaction.user.id);
    }
    else if (!user && targetUser.id !== interaction.user.id) {
        await interaction.editReply({
            content: "This user doesn't have a waifu collection yet. They need to run `/waifus` first.",
        });
        return;
    }
    const specWaifus = Object.keys(waifus_json_1.default).filter((w) => {
        const waifuData = waifus_json_1.default[w];
        return waifuData.spec;
    });
    const nonSpecWaifus = Object.keys(waifus_json_1.default).filter((w) => {
        const waifuData = waifus_json_1.default[w];
        return !waifuData.spec;
    });
    const unlockedSpecWaifus = [];
    const unlockedNonSpecWaifus = [];
    user.waifus?.forEach((w) => {
        if (!w.spec) {
            if (!unlockedNonSpecWaifus.includes(w.name))
                unlockedNonSpecWaifus.push(w.name);
        }
        else if (!unlockedSpecWaifus.includes(w.name))
            unlockedSpecWaifus.push(w.name);
    });
    if (name) {
        const waifusLowerCase = Object.keys(waifus_json_1.default).map((w) => w.toLowerCase());
        if (!waifusLowerCase.includes(name.toLowerCase())) {
            await interaction.editReply({
                content: "That waifu doesn't exist!",
            });
            return;
        }
        const waifuName = Object.keys(waifus_json_1.default)[waifusLowerCase.indexOf(name.toLowerCase())];
        const waifuData = waifus_json_1.default[waifuName];
        const userWaifus = await user.getWaifus({
            where: {
                name: waifuName,
            },
        });
        if (userWaifus.length === 0) {
            if (waifuData.spec) {
                await interaction.editReply({
                    content: "You don't have this waifu unlocked! You can unlock her by using `/airrec`.",
                });
                return;
            }
            await interaction.editReply({
                content: "You don't have this waifu unlocked! You can unlock her by winning airrec quizzes.",
            });
            return;
        }
        const won = userWaifus.reduce((acc, w) => acc + w.kills, 0);
        const lost = userWaifus.reduce((acc, w) => acc + w.deaths, 0);
        const waifuEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0xff00ff)
            .setTitle(waifuName)
            .setAuthor({
            name: targetUser.username,
            iconURL: targetUser.avatarURL(),
        })
            .setThumbnail(targetUser.avatarURL())
            .setImage(`attachment://${waifuData.urlFriendlyName ?? waifuName}.jpg`)
            .setFooter({
            text: `You can unlock ${specWaifus.length - unlockedSpecWaifus.length} more waifus with /airrec and ${nonSpecWaifus.length - unlockedNonSpecWaifus.length} more waifus by winning airrec quizzes!`,
        })
            .setDescription(`
This user has ${userWaifus.length} cop${userWaifus.length === 1 ? "y" : "ies"} of this waifu!\n
${userWaifus.some((w) => w.generated)
            ? "One or more of this waifu was generated."
            : ""}${userWaifus.some((w) => waifus_json_1.default[w.name].spec &&
            !w.generated)
            ? "One or more of this waifu was unlocked with `/airrec`!"
            : ""}${userWaifus.some((w) => !waifus_json_1.default[w.name].spec &&
            !w.generated)
            ? "One or more of this waifu was unlocked by winning an airrec quiz!"
            : ""} In dogfighting, this waifu has won ${won} time${won === 1 ? "" : "s"} and lost ${lost} time${lost === 1 ? "" : "s"}.
			`);
        userWaifus.forEach((w) => {
            waifuEmbed.addFields({
                name: `Copy #${userWaifus.indexOf(w) + 1}`,
                value: `ATK: ${w.atk}\nHP: ${w.hp}\nSPD: ${w.spd}\n`,
                inline: true,
            });
        });
        if (waifuData.ability) {
            waifuEmbed.addFields({
                name: waifuData.abilityName,
                value: waifuData.abilityDescription,
            });
        }
        await interaction.editReply({
            embeds: [waifuEmbed],
            files: [waifuData.path],
            components: [],
        });
        return;
    }
    const waifuCopies = {};
    const waifuList = [];
    const userWaifus = await user.getWaifus();
    userWaifus.forEach((w) => {
        if (w.generated) {
            if (!waifuList.includes(`\\*${w.name}`)) {
                waifuList.push(`\\*${w.name}`);
                waifuCopies[w.name] = 1;
            }
            else {
                waifuCopies[w.name]++;
            }
        }
        else if (!waifuList.includes(w.name)) {
            waifuList.push(w.name);
            waifuCopies[w.name] = 1;
        }
        else {
            waifuCopies[w.name]++;
        }
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xff00ff)
        .setTitle(`${targetUser.username}'s Waifu Collection`)
        .setAuthor({
        name: targetUser.username,
        iconURL: targetUser.avatarURL(),
    })
        .setThumbnail(targetUser.avatarURL())
        .setDescription(`You have **${waifuList.length}/${Object.keys(waifus_json_1.default).length}** waifus unlocked! ${user.guaranteeWaifu
        ? `You need to obtain **${10 - user.guaranteeCounter}** more waifu(s) before you get a guaranteed **${user
            .guaranteeWaifu}**.`
        : "You are not currently targetting a waifu."} You have won **${user.kills}** dogfights and lost **${user.deaths}** dogfights.`)
        .addFields({
        name: "Unlocked Waifus",
        value: waifuList
            .map((w) => `**${w} (${waifuCopies[w.replace("\\*", "")]})**`)
            .join(", ") || "None",
        inline: true,
    }, {
        name: "Locked Waifus",
        value: user.lockedWaifus.join(", ") || "None",
        inline: true,
    })
        .setFooter({
        text: `${waifuList.filter((w) => w.startsWith("\\*")).length > 0
            ? "*This waifu was generated."
            : ""}\nYou can unlock ${specWaifus.length - unlockedSpecWaifus.length} more waifus with /airrec and ${nonSpecWaifus.length - unlockedNonSpecWaifus.length} more waifus by winning airrec quizzes!`,
    });
    await interaction.editReply({
        embeds: [embed],
    });
}
exports.execute = execute;
