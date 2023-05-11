import { SlashCommandBuilder } from "discord.js";
import { User } from "../models.js";
import waifus from "../waifus.json" assert { type: "json" };
const wait = (await import("node:timers/promises")).setTimeout;
export const data = new SlashCommandBuilder()
    .setName("gen-waifu")
    .setDescription("Generate a waifu.")
    // .setDefaultMemberPermissions(8)
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name of the waifu you want to generate.")
    .setRequired(true))
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user to generate a waifu for. Defaults to you."))
    .addIntegerOption((option) => option
    .setName("amount")
    .setDescription("The amount of waifus you want to generate (max (including existing dupes) is 25). Defaults to 1.")
    .setMaxValue(25))
    .addIntegerOption((option) => option
    .setName("atk")
    .setDescription("The ATK stat of the waifu to generate. Defaults to RNG."))
    .addIntegerOption((option) => option
    .setName("hp")
    .setDescription("The HP stat of the waifu to generate (only for aircraft). Defaults to RNG."))
    .addIntegerOption((option) => option
    .setName("spd")
    .setDescription("The SPD stat of the waifu to generate (only for aircraft). Defaults to RNG."))
    .addBooleanOption((option) => option
    .setName("show_as_legit")
    .setDescription("Whether to show the waifu as it it was not generated. Defaults to false."))
    .addIntegerOption((option) => option
    .setName("kills")
    .setDescription("The kills stat of the waifu to generate (only for aircraft). Defaults to 0."))
    .addIntegerOption((option) => option
    .setName("deaths")
    .setDescription("The deaths stat of the waifu to generate (only for aircraft). Defaults to 0."));
export async function execute(interaction) {
    const targetUser = interaction.options.getUser("user") ?? interaction.user;
    const name = interaction.options.getString("name");
    const amount = interaction.options.getInteger("amount") ?? 1;
    const atk = interaction.options.getInteger("atk") ?? null;
    const hp = interaction.options.getInteger("hp") ?? null;
    const spd = interaction.options.getInteger("spd") ?? null;
    const showAsLegit = interaction.options.getBoolean("show_as_legit") ?? false;
    const kills = interaction.options.getInteger("kills") ?? 0;
    const deaths = interaction.options.getInteger("deaths") ?? 0;
    const waifusLowerCase = Object.keys(waifus).map((w) => w.toLowerCase());
    if (!waifusLowerCase.includes(name.toLowerCase())) {
        await interaction.reply({
            content: "That waifu doesn't exist!",
            ephemeral: true,
        });
        return;
    }
    const waifuName = Object.keys(waifus)[waifusLowerCase.indexOf(name.toLowerCase())];
    const waifuData = waifus[waifuName];
    await interaction.client.application.fetch();
    if (interaction.user !== interaction.client.application.owner) {
        await interaction.reply({
            content: `Successfully generated ${amount} ${waifuName} waifu(s) (use \`/waifus user:${targetUser}\`) for ${targetUser.username}!`,
        });
        await wait(3000);
        await interaction.followUp({
            content: "https://media.tenor.com/KjXLIHAAeRkAAAAd/wakey-wakey-time-for-scoo.gif",
        });
        return;
    }
    await interaction.reply({
        content: "Generating waifu...",
        ephemeral: true,
    });
    const user = await User.findByPk(targetUser.id);
    if (!user) {
        await interaction.editReply({
            content: "This user doesn't have a profile yet. They need to use `/waifus` or `/stats` first.",
        });
        return;
    }
    const userWaifus = await user.countWaifus({
        where: {
            name: waifuName,
        },
    });
    if (userWaifus + amount > 25) {
        await interaction.editReply({
            content: `You can't generate more than 25 waifus of the same type (including existing dupes). You can generate a maximum of **${25 - userWaifus}** more ${waifuName} waifu(s) for this user.
					`,
        });
        return;
    }
    for (let i = 0; i < amount; i++) {
        const thisAtk = atk ?? Math.ceil(Math.random() * 10);
        let thisHp = hp ?? Math.ceil(Math.random() * (100 - 50) + 50);
        let thisSpd = spd ?? Math.ceil(Math.random() * 10);
        let thisKills = kills;
        let thisDeaths = deaths;
        if (waifuData.type === "weapon") {
            thisHp = 0;
            thisSpd = 0;
            thisKills = 0;
            thisDeaths = 0;
        }
        const waifu = await user.createWaifu({
            name: waifuName,
            spec: waifuData.spec,
            atk: thisAtk,
            hp: thisHp,
            spd: thisSpd,
            generated: true,
            kills: thisKills,
            deaths: thisDeaths,
        });
        if (showAsLegit) {
            await waifu.update({
                generated: false,
            });
            await user.update({
                lockedWaifus: user.lockedWaifus.filter((w) => w !== waifuName),
            });
        }
    }
    await interaction.editReply({
        content: `Successfully generated ${amount} ${waifuName} waifu(s) (use \`/waifus user:${targetUser}\`) for ${targetUser.username}!`,
    });
}
