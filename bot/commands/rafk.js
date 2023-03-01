"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = require("discord.js");
const RAFK_json_1 = __importDefault(require("../RAFK.json"));
const wait = require("node:timers/promises").setTimeout;
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("rafk")
    .setDescription("Gives you a question about RAFK.")
    .addIntegerOption((option) => option
    .setName("part")
    .setDescription("The part of RAFK you want to be asked about (1-3). Leave blank for a random part.")
    .setMinValue(1)
    .setMaxValue(3))
    .addBooleanOption((option) => option
    .setName("random")
    .setDescription("Whether to use a specific RAFK subject or a random question. Leave blank for a random question."));
async function execute(interaction) {
    const random = interaction.options.getBoolean("random") ?? true;
    await interaction.deferReply();
    // const part =
    // 	interaction.options.getInteger("part") ??
    // 	Math.floor(Math.random() * 3) + 1;
    const part = RAFK_json_1.default[1];
    const selectId = crypto_1.default.randomBytes(6).toString("hex");
    let subject = part[Object.keys(part)[Math.floor(Math.random() * Object.keys(part).length)]];
    if (!random) {
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`select-subject-${selectId}`)
            .setPlaceholder("Select a subject"));
        for (const subj in part) {
            if (Object.prototype.hasOwnProperty.call(part, subj)) {
                row.components[0].addOptions({
                    label: subj,
                    value: subj,
                });
            }
        }
        await interaction.editReply({
            components: [row],
        });
        const filter = (i) => i.customId === `select-subject-${selectId}`;
        const selections = await interaction.channel?.awaitMessageComponent({
            componentType: discord_js_1.ComponentType.StringSelect,
            time: 30000,
            filter,
        });
        if (selections) {
            if (selections.user.id !== interaction.user.id) {
                await selections.reply({
                    content: "You can't select a subject.",
                    ephemeral: true,
                });
            }
            else {
                subject = part[selections.values[0]];
                await selections.deferUpdate();
            }
        }
    }
    const category = subject[Object.keys(subject)[Math.floor(Math.random() * Object.keys(subject).length)]];
    const randomQuestion = category[Math.floor(Math.random() * category.length)];
    const { question, answer } = randomQuestion;
    const buttonId = crypto_1.default.randomBytes(6).toString("hex");
    const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`reveal-rafk-${buttonId}`)
        .setLabel("Reveal answer")
        .setStyle(discord_js_1.ButtonStyle.Primary));
    await interaction.editReply({
        content: question,
        components: [row],
    });
    const filter = (i) => i.customId === `reveal-rafk-${buttonId}`;
    const collector = interaction.channel?.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: 60000,
        filter,
    });
    collector?.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({
                content: "You can't reveal this answer.",
                ephemeral: true,
            });
        }
        else {
            await interaction.editReply({
                content: `${question}\n**${answer}**`,
                components: [],
            });
        }
    });
    await wait(30000);
    await interaction.editReply({
        content: `\n${question}\n**${answer}**`,
        components: [],
    });
}
exports.execute = execute;
