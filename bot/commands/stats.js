"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
const waifus_json_1 = __importDefault(require("../waifus.json"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("stats")
    .setDescription("Get your Plane stats.")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to view the stats of. Defaults to you."));
async function execute(interaction) {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    await interaction.deferReply();
    const guild = await models_1.Guild.findByPk(interaction.guildId);
    let user = await models_1.User.findByPk(targetUser.id);
    if (!user && targetUser.id === interaction.user.id) {
        await guild.createUser({
            id: interaction.user.id,
            username: interaction.user.username,
            discriminator: interaction.user.discriminator,
            avatarUrl: interaction.user.avatarURL(),
            lockedWaifus: Object.keys(waifus_json_1.default),
            dogfightKills: 0,
            dogfightDeaths: 0,
            dogfightWinstreak: 0,
            airrecQuizWins: 0,
            airrecQuizLosses: 0,
            airrecQuizWinstreak: 0,
        });
        user = await models_1.User.findByPk(interaction.user.id);
    }
    else if (!user && targetUser.id !== interaction.user.id) {
        await interaction.editReply({
            content: "This user doesn't have a profile yet. They need to use `/waifus` or `/stats` first.",
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
