"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const redis_1 = require("redis");
const RAFK_json_1 = __importDefault(require("../RAFK.json"));
const wait = require("node:timers/promises").setTimeout;
const joshId = "1084882617964441610";
const joshUsername = "J0sh";
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
    let isJoshOnline = false;
    try {
        const conn = (0, redis_1.createClient)({
            url: "redis://host.docker.internal:6379",
        });
        await conn.connect();
        isJoshOnline = true;
    }
    catch (err) {
        isJoshOnline = false;
    }
    let isJoshParticipating = false;
    let pub;
    if (isJoshOnline) {
        const listener = async (m, c) => {
            if (c !== "josh-new-quiz" || m !== "accept")
                return;
            isJoshParticipating = true;
            await thread.send({
                content: `<@${joshId}> has joined the game!`,
            });
        };
        pub = (0, redis_1.createClient)({
            url: "redis://host.docker.internal:6379",
        });
        pub.on("error", (err) => console.error(err));
        const sub = pub.duplicate();
        sub.on("error", (err) => console.error(err));
        await sub.connect();
        await sub.subscribe("josh-new-quiz", listener);
        await pub.connect();
        await pub.publish("josh-new-quiz", thread.id);
    }
    await thread.send({
        content: `
__**RAFK Part ${1} Quiz**__
You will be given 2 questions from each category in Part ${part} of RAFK. You will have 10 seconds to answer each question. Good luck!

**Starting in 10 seconds...**
		`,
    });
    await wait(10000);
    const questions = [];
    const doQuestion = async (randomQuestion) => 
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
        const { question, answer } = randomQuestion;
        const msg = await thread.send({
            content: `${question}\n**The answer will be revealed in 10 seconds...**`,
        });
        if (isJoshParticipating)
            await pub.publish("josh-do-quiz", answer);
        await wait(10000);
        await msg.edit({
            content: `${question}\n**${answer}**`,
        });
        resolve(true);
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
    if (isJoshParticipating)
        await pub.publish("josh-do-quiz", "end");
    await thread.setArchived(true);
}
exports.execute = execute;
