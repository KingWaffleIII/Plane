import crypto from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, SlashCommandBuilder, } from "discord.js";
import rafk from "../RAFK.json" assert { type: "json" };
export const data = new SlashCommandBuilder()
    .setName("rafk")
    .setDescription("Gives you a question about RAFK.")
    .addIntegerOption((option) => option
    .setName("part")
    .setDescription("The part of RAFK you want to be asked about (1-3). Defaults to a random part.")
    .setMinValue(1)
    .setMaxValue(3))
    .addStringOption((option) => option
    .setName("subject")
    .setDescription("The subject you want to be asked about. Defaults to a random subject.")
    .addChoices({ name: "The RAF", value: "The RAF" }, { name: "The CCF", value: "The CCF" }, { name: "Airmanship", value: "Airmanship" }, { name: "Map Reading", value: "Map Reading" }));
export async function execute(interaction) {
    const requestedSubject = interaction.options.getString("subject") ?? false;
    await interaction.deferReply();
    // const part =
    // 	interaction.options.getInteger("part") ??
    // 	Math.floor(Math.random() * 3) + 1;
    const part = rafk[1];
    let subject = part[Object.keys(part)[Math.floor(Math.random() * Object.keys(part).length)]];
    if (requestedSubject) {
        subject = part[requestedSubject];
    }
    const category = subject[Object.keys(subject)[Math.floor(Math.random() * Object.keys(subject).length)]];
    const randomQuestion = category[Math.floor(Math.random() * category.length)];
    const { question, answer } = randomQuestion;
    const buttonId = crypto.randomBytes(6).toString("hex");
    const row = new ActionRowBuilder().addComponents(new ButtonBuilder()
        .setCustomId(`reveal-rafk-${buttonId}`)
        .setLabel("Reveal answer")
        .setStyle(ButtonStyle.Primary));
    await interaction.editReply({
        content: question,
        components: [row],
    });
    const filter = (i) => i.customId === `reveal-rafk-${buttonId}`;
    const collector = interaction.channel?.createMessageComponentCollector({
        componentType: ComponentType.Button,
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
    collector?.on("end", async (collected) => {
        if (collected.filter((i) => i.user.id === interaction.user.id).size ===
            0)
            await interaction.editReply({
                content: `${question}\n**${answer}**`,
                components: [],
            });
    });
}
