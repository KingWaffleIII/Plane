import crypto from "crypto";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder, } from "discord.js";
import { Guild, User } from "../models.js";
import { getImage, makeEmbedWithImage } from "./airrec.js";
import mrast from "../mrast.json" assert { type: "json" };
import rast from "../rast.json" assert { type: "json" };
import waifus from "../waifus.json" assert { type: "json" };
const wait = (await import("node:timers/promises")).setTimeout;
// stop crashing if thread is deleted pre-emptively
process.on("unhandledRejection", (_error) => {
    // assume it's because the thread was deleted
    console.error("Thread was deleted before it could finish.");
});
function checkAnswer(message, aircraft) {
    if (message.toLowerCase() === aircraft.name.toLowerCase()) {
        return 2;
    }
    if (aircraft.aliases.some((alias) => message.toLowerCase().includes(alias.toLowerCase())) ||
        message.toLowerCase().includes(aircraft.model.toLowerCase())) {
        return 1;
    }
    return 0;
}
async function spawnWaifu(guild, user, rounds, score, name) {
    let isGuaranteed = false;
    if (user.guaranteeWaifu) {
        isGuaranteed =
            user.guaranteeWaifu !== undefined && user.guaranteeCounter >= 10;
    }
    const doSpawn = () => {
        // If waifus are disabled, don't spawn
        if (!guild.waifusEnabled) {
            return false;
        }
        // If the user has a guaranteed waifu, spawn it
        if (isGuaranteed) {
            return true;
        }
        // Set a minimum number of rounds before a waifu can spawn
        if (rounds < 5) {
            return false;
        }
        // Generate a random number between 0 and 1
        const randomNum = Math.random();
        // Calculate the probability of returning true based on the score (score is halved as you can earn 2 points in each round)
        const probability = score / 2 / rounds;
        // Return true if the random number is less than the probability, otherwise return false
        if (randomNum < probability) {
            return true;
        }
        return false;
    };
    if (doSpawn()) {
        if (name === user.guaranteeWaifu) {
            await user.update({
                guaranteeWaifu: null,
                guaranteeCounter: null,
            });
        }
        else if (user.guaranteeWaifu) {
            if (user.guaranteeCounter < 10) {
                await user.update({
                    guaranteeCounter: user.guaranteeCounter + 1,
                });
            }
        }
        if (name) {
            if (Object.keys(waifus).includes(name)) {
                const waifu = waifus[name];
                if (waifu.urlFriendlyName) {
                    return {
                        name,
                        urlFriendlyName: waifu.urlFriendlyName,
                        path: waifu.path,
                        type: waifu.type,
                        abilityName: waifu.abilityName,
                        abilityDescription: waifu.abilityDescription,
                    };
                }
                return {
                    name,
                    urlFriendlyName: name,
                    path: waifu.path,
                    type: waifu.type,
                    abilityName: waifu.abilityName,
                    abilityDescription: waifu.abilityDescription,
                };
            }
            return null;
        }
        const waifuName = Object.keys(waifus)[Math.floor(Math.random() * Object.keys(waifus).length)];
        const waifu = waifus[waifuName];
        if (waifu.urlFriendlyName) {
            return {
                name: waifuName,
                urlFriendlyName: waifu.urlFriendlyName,
                path: waifu.path,
                type: waifu.type,
                abilityName: waifu.abilityName,
                abilityDescription: waifu.abilityDescription,
            };
        }
        return {
            name: waifuName,
            urlFriendlyName: waifuName,
            path: waifu.path,
            type: waifu.type,
            abilityName: waifu.abilityName,
            abilityDescription: waifu.abilityDescription,
        };
    }
    return null;
}
export const data = new SlashCommandBuilder()
    .setName("airrec-quiz")
    .setDescription("Gives you a series of aircraft images for you and others to identify with scoring.")
    .addStringOption((option) => option
    .setName("spec")
    .setDescription("The spec you want to use (mRAST is RAF past/present). Defaults to RAST.")
    .addChoices({ name: "mRAST", value: "mRAST" }, { name: "RAST", value: "RAST" }))
    .addIntegerOption((option) => option
    .setName("rounds")
    .setDescription("The number of rounds you want to play. Defaults to 10 rounds.")
    .setMinValue(1)
    .setMaxValue(30));
export async function execute(interaction) {
    const rounds = interaction.options.getInteger("rounds") ?? 10;
    const spec = interaction.options.getString("spec") ?? "RAST";
    const guild = await Guild.findByPk(interaction.guildId);
    if (!guild) {
        await Guild.create({
            id: interaction.guildId,
            name: interaction.guild.name,
            waifusEnabled: false,
        });
    }
    await interaction.reply({
        content: "Creating a new thread...",
    });
    const c = interaction.channel;
    const thread = await c.threads.create({
        name: `${spec} Aircraft Recognition Quiz`,
        autoArchiveDuration: 60,
        reason: `${spec} Aircraft Recognition Quiz`,
    });
    await interaction.editReply({
        content: "Thread created! Click here:",
    });
    const buttonId = crypto.randomBytes(6).toString("hex");
    const row = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
            .setCustomId(`play-${buttonId}`)
            .setLabel("Play")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`skip-${buttonId}`)
            .setLabel("Start now")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId(`cancel-${buttonId}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger),
    ]);
    const msg = await thread.send({
        content: `
__**${spec} Aircraft Recognition Quiz**__
You will be shown pictures of **${rounds}** aircraft and you will have to reply with the name of the aircraft.
You will be given 15 seconds for an answer (**you will only be allowed one response so don't send any messages unless you are sending an answer**).

__**Scoring:**__
You will get **2 points** for listing the aircraft manufacturer and model. For example: "Lockheed Martin F-22".
You will get **1 point** for listing the aircraft model or alias(es) only. For example: "F-22" or "Raptor".
The leaderboard will be shown every round.
Note: it is **very hard** to consistently get 2 points, so don't worry if you only get 1 point.

If you want to play, click the button below.
**Starting in 60 seconds...**
		`,
        components: [row],
    });
    const players = {};
    const playFilter = (i) => i.customId === `play-${buttonId}` ||
        i.customId === `skip-${buttonId}` ||
        i.customId === `cancel-${buttonId}`;
    const collector = thread.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: playFilter,
    });
    collector?.on("collect", async (i) => {
        if (i.customId === `cancel-${buttonId}`) {
            if (i.user.id !== interaction.user.id) {
                i.reply({
                    content: "You can't cancel this game.",
                    ephemeral: true,
                });
                return;
            }
            collector?.stop("stop");
            await interaction.editReply({
                content: "This game has been cancelled.",
                components: [],
            });
            return;
        }
        if (i.customId === `skip-${buttonId}`) {
            if (i.user.id !== interaction.user.id) {
                i.reply({
                    content: "You can't start this game.",
                    ephemeral: true,
                });
                return;
            }
            collector?.stop();
            return;
        }
        if (!Object.keys(players).includes(i.user.id)) {
            players[i.user.id] = {
                username: i.user.username,
                score: 0,
                lastScore: 0,
            };
            i.reply({
                content: `<@${i.user.id}> has joined the game!`,
            });
        }
        else {
            i.reply({
                content: "You have already joined the game.",
                ephemeral: true,
            });
        }
        if (Object.keys(players).length >= 0) {
            row.components[1].setDisabled(false);
            await msg.edit({
                components: [row],
            });
        }
    });
    collector?.on("end", async (_collected, reason) => {
        if (reason && reason === "stop") {
            await thread.delete();
            return;
        }
        if (Object.keys(players).length === 0) {
            await thread.delete();
            await interaction.followUp({
                content: "No one joined the game...",
            });
            return;
        }
        await msg.edit({
            components: [],
        });
        for (let i = 0; i < rounds; i++) {
            const list = spec === "RAST" ? rast : mrast;
            const aircraft = list[Math.floor(Math.random() * list.length)];
            const image = await getImage(aircraft.image);
            if (!image) {
                await thread.send({
                    content: "Sorry, I encountered an issue in retrieving an image. Please try again later.",
                });
                return;
            }
            const embed = makeEmbedWithImage(image);
            const question = await thread.send({
                content: `**Round ${i + 1} of ${rounds}:**`,
                embeds: [embed],
                components: [],
            });
            const answered = [];
            const answerFilter = (m) => {
                if (!answered.includes(m.author.id)) {
                    answered.push(m.author.id);
                    return Object.keys(players).includes(m.author.id);
                }
                return false;
            };
            const messages = await thread.awaitMessages({
                time: 15000,
                max: Object.keys(players).length,
                filter: answerFilter,
                // errors: ["time"],
            });
            Object.keys(players).forEach((player) => {
                players[player].lastScore = players[player].score;
            });
            if (messages && messages.size > 0) {
                messages.forEach(async (message) => {
                    const score = checkAnswer(message.content, aircraft);
                    players[message.author.id].score += score;
                });
            }
            const answer = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(aircraft.name)
                .setDescription(aircraft.role)
                .setImage(image)
                .setTimestamp()
                .setFooter({
                text: "Photo credit: see bottom of image.",
            })
                .addFields({
                name: "Alternative names (aliases for /airrec-quiz):",
                value: aircraft.aliases.join(", ") || "None",
            }, {
                name: "Aircraft features to help you identify it:",
                value: aircraft.identification
                    .map((identification) => `- ${identification}\n`)
                    .join("") || "None",
            }, 
            // { name: "\u200B", value: "\u200B" },
            {
                name: "Wikipedia:",
                value: aircraft.wiki,
                inline: true,
            }, {
                name: "See more images:",
                value: aircraft.image,
                inline: true,
            });
            const sortedPlayers = Object.keys(players).sort((a, b) => players[b].score - players[a].score);
            const leaderboard = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle("Leaderboard")
                .setTimestamp()
                .setDescription(sortedPlayers
                .map((userId) => {
                const player = players[userId];
                return `#${sortedPlayers.indexOf(userId) + 1} **${player.username}**: ${player.lastScore} -> **${player.score}**`;
            })
                .join("\n"))
                .setFooter({
                text: `Round ${i + 1} of ${rounds}`,
            });
            await question.reply({
                content: `**The answer was ${aircraft.name}!**\nContinuing in 10 seconds...`,
                embeds: [answer, leaderboard],
            });
            await wait(10000);
        }
        const winners = [];
        const sortedPlayers = Object.keys(players).sort((a, b) => players[b].score - players[a].score);
        if (players[sortedPlayers[0]].score !== 0) {
            winners.push(sortedPlayers[0]);
            if (sortedPlayers.length !== 1) {
                // check if there's a tie and how many people are tied
                if (players[sortedPlayers[0]].score ===
                    players[sortedPlayers[1]].score) {
                    for (let i = 1; i < sortedPlayers.length; i++) {
                        if (players[sortedPlayers[i]].score ===
                            players[sortedPlayers[0]].score) {
                            winners.push(sortedPlayers[i]);
                        }
                    }
                }
            }
        }
        const leaderboard = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("Final Leaderboard")
            .setDescription(sortedPlayers
            .map((userId) => {
            const player = players[userId];
            return `#${sortedPlayers.indexOf(userId) + 1} **${player.username}**: ${player.score}`;
        })
            .join("\n"))
            .setTimestamp();
        await thread.send({
            content: "The game has ended! Here's the final leaderboard:",
            embeds: [leaderboard],
            components: [],
        });
        if (winners.length > 1) {
            sortedPlayers
                .filter((p) => !winners.includes(p))
                .forEach(async (p) => {
                const user = await User.findByPk(p);
                if (user) {
                    await user.update({
                        airrecQuizLosses: user.airrecQuizLosses + 1,
                        airrecQuizWinstreak: 0,
                    });
                }
            });
        }
        winners.forEach(async (u) => {
            // check if user exists in db
            const user = await User.findByPk(u);
            if (!user) {
                await thread.send({
                    content: `**<@${u}>, you doesn't have a profile yet! Use \`/waifus\` or \`/stats\` to get one!**`,
                });
            }
            else {
                if (winners.length > 1) {
                    await user.update({
                        airrecQuizWins: user.airrecQuizWins + 1,
                        airrecQuizWinstreak: user.airrecQuizWinstreak + 1,
                    });
                }
                const isGuaranteed = user.guaranteeWaifu && user.guaranteeCounter >= 10;
                let waifu;
                if (isGuaranteed) {
                    waifu = await spawnWaifu(guild, user, rounds, players[u].score, user.guaranteeWaifu);
                }
                else {
                    waifu = await spawnWaifu(guild, user, rounds, players[u].score);
                }
                if (waifu) {
                    const atk = Math.ceil(Math.random() * 10);
                    let hp = Math.ceil(Math.random() * (100 - 50) + 50);
                    let spd = Math.ceil(Math.random() * 10);
                    if (waifu.type === "weapon") {
                        hp = 0;
                        spd = 0;
                    }
                    const waifuEmbed = new EmbedBuilder()
                        .setColor(0xff00ff)
                        .setTitle(waifu.name)
                        .setImage(`attachment://${waifu.urlFriendlyName}.jpg`)
                        .setDescription(`You can view your waifu collection by using \`/waifus\`!`)
                        .addFields({
                        name: "ATK",
                        value: atk.toString(),
                        inline: true,
                    }, {
                        name: "HP",
                        value: hp.toString(),
                        inline: true,
                    }, {
                        name: "SPD",
                        value: spd.toString(),
                        inline: true,
                    })
                        .setFooter({
                        text: "You unlocked an waifu! Image credit: Atamonica",
                    });
                    if (waifu.abilityName) {
                        waifuEmbed.addFields({
                            name: waifu.abilityName,
                            value: waifu.abilityDescription,
                        });
                    }
                    await thread.send({
                        content: `<@${user.id}> has unlocked a new waifu!`,
                        embeds: [waifuEmbed],
                        files: [waifu.path],
                    });
                    await user.createWaifu({
                        name: waifu.name,
                        atk,
                        hp,
                        spd,
                        kills: 0,
                        deaths: 0,
                    });
                    await user.update({
                        lockedWaifus: user.lockedWaifus.filter((w) => w !== waifu.name),
                    });
                }
            }
        });
        await thread.setArchived(true);
    });
}
