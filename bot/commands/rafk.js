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
    .addStringOption((option) => option
    .setName("subject")
    .setDescription("The subject you want to be asked about. Leave blank for a random subject.")
    .addChoices({ name: "The RAF", value: "The RAF" }, { name: "The CCF", value: "The CCF" }, { name: "Airmanship", value: "Airmanship" }, { name: "Map Reading", value: "Map Reading" }));
async function execute(interaction) {
    const requestedSubject = interaction.options.getString("subject") ?? false;
    await interaction.deferReply();
    // const part =
    // 	interaction.options.getInteger("part") ??
    // 	Math.floor(Math.random() * 3) + 1;
    const part = RAFK_json_1.default[1];
    let subject = part[Object.keys(part)[Math.floor(Math.random() * Object.keys(part).length)]];
    if (requestedSubject) {
        subject = part[requestedSubject];
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
