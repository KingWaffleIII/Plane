"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
const waifus_json_1 = __importDefault(require("../waifus.json"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("waifus")
    .setDescription("View your waifu collection.")
    .addBooleanOption((option) => option
    .setName("select")
    .setDescription("Whether or not you want to pick a waifu you've unlocked or see your general collection."));
async function execute(interaction) {
    const select = interaction.options.getBoolean("select") ?? false;
    await interaction.deferReply();
    const guild = await models_1.Guild.findByPk(interaction.guildId);
    let user = await models_1.User.findByPk(interaction.user.id);
    if (!user) {
        await guild.createUser({
            id: interaction.user.id,
            username: interaction.user.username,
        });
        user = await models_1.User.findByPk(interaction.user.id);
    }
    const specWaifus = Object.keys(waifus_json_1.default).filter((w) => {
        const waifuData = waifus_json_1.default[w];
        return waifuData.spec;
    });
    const nonSpecWaifus = Object.keys(waifus_json_1.default).filter((w) => {
        const waifuData = waifus_json_1.default[w];
        return !waifuData.spec;
    });
    const unlockedSpecWaifus = specWaifus.filter((w) => user.unlockedWaifus.includes(w));
    const unlockedNonSpecWaifus = nonSpecWaifus.filter((w) => user.unlockedWaifus.includes(w));
    if (select) {
        const selectId = crypto_1.default.randomBytes(12).toString("hex");
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`select-waifu-${selectId}`)
            .setPlaceholder("Select a waifu"));
        user.unlockedWaifus.forEach((waifu) => {
            row.components[0].addOptions({
                label: waifu,
                value: waifu,
            });
        });
        await interaction.editReply({
            components: [row],
        });
        const filter = (i) => i.customId === `select-waifu-${selectId}`;
        const selections = await interaction.channel?.awaitMessageComponent({
            componentType: discord_js_1.ComponentType.StringSelect,
            time: 30000,
            filter,
        });
        let waifu = null;
        let waifuData = null;
        if (selections) {
            if (selections.user.id !== interaction.user.id) {
                await selections.reply({
                    content: "You can't select a waifu.",
                    ephemeral: true,
                });
            }
            else {
                // eslint-disable-next-line prefer-destructuring
                waifu = selections.values[0];
                waifuData =
                    waifus_json_1.default[selections.values[0]];
                await selections.deferUpdate();
            }
        }
        if (!user.unlockedWaifus.includes(waifu)) {
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
        console.log(waifuData.urlFriendlyName, waifuData.path);
        const waifuEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0xff00ff)
            .setTitle(waifu)
            .setImage(`attachment://${waifuData.urlFriendlyName ?? waifu}.jpg`)
            .setFooter({
            text: `You can unlock ${specWaifus.length - unlockedSpecWaifus.length} more waifus with /airrec and ${nonSpecWaifus.length - unlockedNonSpecWaifus.length} more waifus by winning airrec quizzes!`,
        });
        if (waifuData.spec) {
            waifuEmbed.setDescription("You unlocked this waifu with `/airrec`!");
        }
        else {
            waifuEmbed.setDescription("You unlocked this waifu by winning an airrec quiz!");
        }
        await interaction.editReply({
            embeds: [waifuEmbed],
            files: [waifuData.path],
            components: [],
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xff00ff)
        .setTitle(`${interaction.user.username}'s Waifu Collection`)
        .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.avatarURL(),
    })
        .setThumbnail(interaction.user.avatarURL())
        .setDescription(`You have ${user.unlockedWaifus.length}/${Object.keys(waifus_json_1.default).length} waifus unlocked!`)
        .addFields({
        name: "Unlocked Waifus",
        value: user.unlockedWaifus.join(", ") || "None",
        inline: true,
    }, {
        name: "Locked Waifus",
        value: user.lockedWaifus.join(", ") || "None",
        inline: true,
    })
        .setFooter({
        text: `You can unlock ${specWaifus.length - unlockedSpecWaifus.length} more waifus with /airrec and ${nonSpecWaifus.length - unlockedNonSpecWaifus.length} more waifus by winning airrec quizzes!`,
    });
    await interaction.editReply({
        embeds: [embed],
    });
}
exports.execute = execute;
