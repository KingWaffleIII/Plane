"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const RAFK_json_1 = __importDefault(require("../RAFK.json"));
const crypto = require("crypto");
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
        const buttonId = crypto.randomBytes(12).toString("hex");
        const selectId = crypto.randomBytes(12).toString("hex");
        await interaction.deferReply();
        let subject = part[Object.keys(part)[(Object.keys(part).length * Math.random()) << 0]];
        let rafkCategory = subject[Object.keys(subject)[(Object.keys(subject).length * Math.random()) << 0]];
        let randomQuestion = rafkCategory[(Math.floor(Math.random() * rafkCategory.max_questions) + 1).toString()];
        const getQuestion = async () => {
            const question = randomQuestion["question"];
            const answer = randomQuestion["answer"];
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`reveal-answer-${buttonId}`)
                .setLabel("Reveal answer")
                .setStyle(discord_js_1.ButtonStyle.Primary));
            await interaction.editReply({
                content: question,
                components: [row],
            });
            const filter = (i) => i.customId === `reveal-answer-${buttonId}`;
            const collector = interaction.channel?.createMessageComponentCollector({
                time: 30000,
                filter,
            });
            collector?.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({
                        content: "You can't reveal the answer to this question.",
                        ephemeral: true,
                    });
                }
                else {
                    console.log("you made it!");
                    await interaction.editReply({
                        content: `${question}\n**${answer}**`,
                        components: [],
                    });
                }
            });
        };
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
            const collector = interaction.channel?.createMessageComponentCollector({
                time: 10000,
                filter,
            });
            collector?.on("collect", async (i) => {
                if (i.user.id !== interaction.user.id) {
                    await i.reply({
                        content: "You can't select a subject.",
                        ephemeral: true,
                    });
                }
                else {
                    subject = part[i.values[0]];
                    rafkCategory =
                        subject[Object.keys(subject)[(Object.keys(subject).length * Math.random()) <<
                            0]];
                    randomQuestion =
                        rafkCategory[(Math.floor(Math.random() * rafkCategory.max_questions) + 1).toString()];
                    await i.deferUpdate();
                    await getQuestion();
                }
            });
        }
        else {
            await getQuestion();
        }
    },
};
