import { SlashCommandBuilder, } from "discord.js";
import rafk from "../RAFK.json" assert { type: "json" };
const wait = (await import("node:timers/promises")).setTimeout;
// stop crashing if thread is deleted pre-emptively
process.on("unhandledRejection", (error) => {
    if (error.name === "Error [ChannelNotCached]")
        return;
    console.error("Unhandled promise rejection:", error);
});
export const data = new SlashCommandBuilder()
    .setName("rafk-quiz")
    .setDescription("Gives you a series of RAFK questions, similar to a part test.")
    .addIntegerOption((option) => option
    .setName("part")
    .setDescription("The part of RAFK you want to be asked about (1-3). Defaults to a random part.")
    .setMinValue(1)
    .setMaxValue(3));
export async function execute(interaction) {
    await interaction.reply({
        content: "Creating a new thread...",
    });
    // const part =
    // 	interaction.options.getInteger("part") ??
    // 	Math.floor(Math.random() * 3) + 1;
    const part = rafk[1];
    const channel = interaction.channel;
    const thread = await channel.threads.create({
        name: `RAFK Part ${1} Quiz`,
        autoArchiveDuration: 60,
        reason: `RAFK Part ${1} Quiz`,
    });
    await interaction.editReply({
        content: "Thread created! Click here:",
    });
    await thread.send({
        content: `
__**RAFK Part ${1} Quiz**__
You will be given 2 questions from each category in Part ${1} of RAFK. You will have 15 seconds to answer each question. Good luck!

**Starting in 15 seconds...**
		`,
    });
    await wait(15000);
    const questions = [];
    const doQuestion = async (randomQuestion) => 
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve) => {
        const { question, answer } = randomQuestion;
        const msg = await thread.send({
            content: `${question}\n**The answer will be revealed in 10 seconds...**`,
        });
        await wait(15000);
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
    await thread.setArchived(true);
}
