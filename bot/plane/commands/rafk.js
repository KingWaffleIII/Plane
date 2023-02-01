"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const RAFK_json_1 = __importDefault(require("../RAFK.json"));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("rafk")
        .setDescription("Gives you a question about RAFK.")
        .addIntegerOption((option) => option
        .setName("part")
        .setDescription("The part of RAFK you want to be asked about (1-3). Leave blank for a random part.")
        .setMinValue(1)
        .setMaxValue(3))
        .addBooleanOption((option) => option
        .setName("random")
        .setDescription("Whether to use a specific RAFK subject or a random question. Leave blank for a random question.")),
    async execute(interaction) {
        // const part =
        // 	interaction.options.getInteger("part") ||
        // 	Math.floor(Math.random() * 3) + 1;r
        const part = RAFK_json_1.default["1"];
        const random = interaction.options.getBoolean("random") ?? true;
        await interaction.deferReply();
        let subject = part[Object.keys(part)[(Object.keys(part).length * Math.random()) << 0]];
        let rafkCategory = subject[Object.keys(subject)[(Object.keys(subject).length * Math.random()) << 0]];
        let randomQuestion = rafkCategory[(Math.floor(Math.random() * rafkCategory.max_questions) + 1).toString()];
        const getQuestion = async () => {
            const question = randomQuestion["question"];
            const answer = randomQuestion["answer"];
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId("reveal-answer")
                .setLabel("Reveal answer")
                .setStyle(discord_js_1.ButtonStyle.Primary));
            await interaction.editReply({
                content: question,
                components: [row],
            });
            const filter = (i) => i.customId === "reveal-answer" &&
                i.user.id === interaction.user.id;
            const collector = interaction.channel?.createMessageComponentCollector({
                max: 1,
                time: 10000,
                filter,
            });
            collector?.on("collect", () => {
                interaction.editReply({
                    content: `${question}\n**${answer}**`,
                    components: [],
                });
            });
        };
        if (!random) {
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("select-subject")
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
                content: "Select a subject.",
                components: [row],
            });
            const filter = (i) => i.customId === "select-subject" &&
                i.user.id === interaction.user.id;
            const collector = interaction.channel?.createMessageComponentCollector({
                max: 1,
                time: 10000,
                filter,
            });
            collector?.on("collect", async (i) => {
                subject = part[i.values[0]];
                rafkCategory =
                    subject[Object.keys(subject)[(Object.keys(subject).length * Math.random()) << 0]];
                randomQuestion =
                    rafkCategory[(Math.floor(Math.random() * rafkCategory.max_questions) + 1).toString()];
                await i.deferUpdate();
                await getQuestion();
            });
        }
        else {
            await getQuestion();
        }
    },
};
