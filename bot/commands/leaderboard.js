import { EmbedBuilder, SlashCommandBuilder, } from "discord.js";
import { User } from "../models.js";
import waifus from "../waifus.json" assert { type: "json" };
export const data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows a server leaderboard for airrec.");
async function calculateScore(user) {
    const { airrecQuizWins, airrecQuizLosses, airrecQuizWinstreak, dogfightKills, dogfightDeaths, dogfightWinstreak, } = user;
    const airrecTotal = airrecQuizWins + airrecQuizLosses;
    const dogfightTotal = dogfightKills + dogfightDeaths;
    // Assign weights to each attribute
    const weights = {
        wins: 0.4,
        losses: -0.1,
        winStreak: 0.3,
        winPercentage: 0.2,
        waifus: 0.2,
    };
    // Calculate the score
    // calculate winpercentage combining airrec and dogfight
    let winPercentage = (airrecQuizWins + dogfightKills) / (airrecTotal + dogfightTotal);
    if (Number.isNaN(winPercentage)) {
        winPercentage = 0;
    }
    const score = weights.wins * airrecQuizWins +
        weights.wins * dogfightKills +
        weights.losses * (1 - airrecQuizLosses) +
        weights.losses * (1 - dogfightDeaths) +
        weights.winStreak * airrecQuizWinstreak +
        weights.winStreak * dogfightWinstreak +
        weights.winPercentage * winPercentage +
        weights.waifus * (await user.countWaifus());
    if (Number.isNaN(score)) {
        return 0;
    }
    return score;
}
export async function execute(interaction) {
    const users = {};
    let sortedUsers = [];
    for (const member of await interaction.guild.members.fetch()) {
        const user = await User.findByPk(member[1].user.id, {
            include: "waifus",
        });
        if (user) {
            users[user.id] = {
                username: user.username,
                airrecQuizWins: user.airrecQuizWins,
                dogfightKills: user.dogfightKills,
                airrecQuizWinstreak: user.airrecQuizWinstreak,
                dogfightWinstreak: user.dogfightWinstreak,
                unlockedWaifus: Object.keys(waifus).length - user.lockedWaifus.length,
                score: await calculateScore(user),
            };
            sortedUsers.push([user.id, await calculateScore(user)]);
        }
    }
    sortedUsers = sortedUsers.sort((a, b) => b[1] - a[1]).splice(0, 20);
    // .splice(Object.keys(users).length - 20, 20);
    sortedUsers.map((m) => `${m[0]}: ${m[1]}`).join("\n");
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${interaction.guild.name} Leaderboard`)
        .setDescription(sortedUsers
        .map((member) => {
        const user = users[member[0]];
        return `#${sortedUsers.indexOf(member) + 1} **${user.username}**: ${user.airrecQuizWins} | ${user.dogfightKills} | ${user.airrecQuizWinstreak} | ${user.dogfightWinstreak} | ${user.unlockedWaifus}`;
    })
        .join("\n"))
        .setFooter({
        text: `Airrec Quiz Wins | Dogfight Kills | Airrec Quiz Winstreak | Dogfight Winstreak | Unlocked Waifus`,
    })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
}
