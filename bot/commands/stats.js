"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("stats")
    .setDescription("Get your Plane stats.")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to view the stats of. Defaults to you."));
async function execute(interaction) {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    await interaction.deferReply();
    const user = await models_1.User.findByPk(targetUser.id);
    if (!user && targetUser.id === interaction.user.id) {
        await interaction.editReply({
            content: `You don't have waifu collection yet! Use \`/waifus\` to create one!`,
        });
        return;
    }
    if (!user && targetUser.id !== interaction.user.id) {
        await interaction.editReply({
            content: `This user doesn't have a waifu collection yet. They need to run \`/waifus\` first.`,
        });
        return;
    }
    // airrec quizzes
    const { airrecQuizWins, airrecQuizLosses } = user;
    const quizTotal = airrecQuizWins + airrecQuizLosses;
    const { airrecQuizWinstreak } = user;
    // dogfights
    const { dogfightKills, dogfightDeaths } = user;
    const dogfightTotal = dogfightKills + dogfightDeaths;
    const { dogfightWinstreak } = user;
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${targetUser.username}'s Stats`)
        .setAuthor({
        name: targetUser.username,
        iconURL: targetUser.avatarURL(),
    })
        .setThumbnail(targetUser.avatarURL())
        .addFields({
        name: `Airrec Quizzes (${quizTotal})`,
        value: `Wins: ${airrecQuizWins}\nLosses: ${airrecQuizLosses}\nWinstreak: ${airrecQuizWinstreak}`,
    }, {
        name: `Dogfights (${dogfightTotal})`,
        value: `Kills: ${dogfightKills}\nDeaths: ${dogfightDeaths}\nWinstreak: ${dogfightWinstreak}`,
    })
        .setFooter({
        text: "You can view specific waifu stats with /waifus.",
    })
        .setTimestamp();
    await interaction.editReply({ embeds: [embed] });
}
exports.execute = execute;
