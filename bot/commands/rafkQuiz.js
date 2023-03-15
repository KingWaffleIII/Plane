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
    .setName("rafk-quiz")
    .setDescription("Gives you a series of RAFK questions, similar to a part test.")
    .addIntegerOption((option) => option
    .setName("part")
    .setDescription("The part of RAFK you want to be asked about (1-3). Defaults to a random part.")
    .setMinValue(1)
    .setMaxValue(3));
async function execute(interaction) {
    await interaction.reply({
        content: "Creating a new thread...",
    });
    // const part =
    // 	interaction.options.getInteger("part") ??
    // 	Math.floor(Math.random() * 3) + 1;
    const part = RAFK_json_1.default[1];
    const channel = interaction.channel;
    const thread = await channel.threads.create({
        name: `RAFK Part ${1} Quiz`,
        autoArchiveDuration: 60,
        reason: `RAFK Part ${1} Quiz`,
    });
    await interaction.editReply({
        content: "Thread created! Click here:",
    });
    const questions = [];
    const doQuestion = async (randomQuestion) => 
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
        const { question, answer } = randomQuestion;
        const buttonId = crypto_1.default.randomBytes(6).toString("hex");
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`reveal-rafk-${buttonId}`)
            .setLabel("Reveal answer")
            .setStyle(discord_js_1.ButtonStyle.Primary));
        const msg = await thread.send({
            content: question,
            components: [row],
        });
        const filter = (i) => i.customId === `reveal-rafk-${buttonId}`;
        const collector = thread.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 10000,
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
                await msg.edit({
                    content: `${question}\n**${answer}**`,
                    components: [],
                });
                resolve(true);
            }
        });
        collector?.on("end", async (collected) => {
            if (collected.size === 0) {
                await msg.edit({
                    content: `\n${question}\n**${answer}**`,
                    components: [],
                });
                resolve(true);
            }
        });
    });
    for (let j = 0; j < Object.keys(part).length; j++) {
        let subject = part[Object.keys(part)[j]];
        let category = subject[Object.keys(subject)[Math.floor(Math.random() * Object.keys(subject).length)]];
        let randomQuestion = category[Math.floor(Math.random() * category.length)];
        if (questions.includes(randomQuestion)) {
            j--;
            continue;
        }
        questions.push(randomQuestion);
        await doQuestion(randomQuestion).then(async () => {
            await wait(3000);
            subject = part[Object.keys(part)[j]];
            category =
                subject[Object.keys(subject)[Math.floor(Math.random() * Object.keys(subject).length)]];
            randomQuestion =
                category[Math.floor(Math.random() * category.length)];
            if (questions.includes(randomQuestion)) {
                j--;
                return;
            }
            questions.push(randomQuestion);
            await doQuestion(randomQuestion).then(async () => {
                await wait(3000);
            });
        });
    }
}
exports.execute = execute;
