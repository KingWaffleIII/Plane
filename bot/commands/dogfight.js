"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
/* eslint-disable no-param-reassign */
/* eslint-disable no-promise-executor-return */
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
const waifus_json_1 = __importDefault(require("../waifus.json"));
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("dogfight")
    .setDescription("Starts a waifu dogfight with another user.")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to dogfight.")
    .setRequired(true));
async function execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    await interaction.deferReply();
    if (interaction.user.id === targetUser.id) {
        await interaction.editReply({
            content: "You can't dogfight yourself!",
        });
        return;
    }
    const initialUserModel = await models_1.User.findByPk(interaction.user.id, {
        include: { model: models_1.Waifu, as: "waifus" },
    });
    const targetUserModel = await models_1.User.findByPk(targetUser.id, {
        include: { model: models_1.Waifu, as: "waifus" },
    });
    if (!initialUserModel || !targetUserModel) {
        await interaction.editReply({
            content: "Either you or the user you want to dogfight don't have waifu collections yet! Use `/waifus` to create one!",
        });
        return;
    }
    const initialUserWaifus = (await initialUserModel.getWaifus())
        .filter((a) => a.hp !== 0 && a.spd !== 0)
        .sort((a, b) => b.atk - a.atk)
        .splice(0, 25);
    const targetUserWaifus = (await targetUserModel.getWaifus())
        .filter((a) => a.hp !== 0 && a.spd !== 0)
        .sort((a, b) => b.atk - a.atk)
        .splice(0, 25);
    if (initialUserWaifus.length === 0 || targetUserWaifus.length === 0) {
        await interaction.editReply({
            content: "Either you or the user you want to dogfight don't have waifus to dogfight with! Get collecting with `/airrec` and `/airrec-quiz`!",
        });
        return;
    }
    let initialWaifu;
    let targetWaifu;
    const initialWaifuSelectId = crypto_1.default.randomBytes(8).toString("hex");
    const initialWaifuSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`dogfight-select-waifu-${initialWaifuSelectId}`)
        .setPlaceholder("Select a waifu"));
    initialUserWaifus.forEach((waifu) => {
        initialWaifuSelect.components[0].addOptions({
            label: `${waifu.name} (ATK: ${waifu.atk} | HP: ${waifu.hp} | SPD: ${waifu.spd})`,
            value: waifu.id.toString(),
        });
    });
    await interaction.editReply({
        content: `<@${interaction.user.id}>, select a waifu!`,
        components: [initialWaifuSelect],
    });
    const initialWaifuSelectFilter = (i) => i.customId === `dogfight-select-waifu-${initialWaifuSelectId}`;
    const initialWaifuSelectCollector = interaction.channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        filter: initialWaifuSelectFilter,
        time: 60000,
    });
    initialWaifuSelectCollector.on("collect", async (initialWaifuSelectInteraction) => {
        if (initialWaifuSelectInteraction.user.id !== interaction.user.id) {
            await initialWaifuSelectInteraction.reply({
                content: "You can't select a waifu.",
                ephemeral: true,
            });
            return;
        }
        await initialWaifuSelectInteraction.deferUpdate();
        initialWaifu = (await models_1.Waifu.findByPk(initialWaifuSelectInteraction.values[0], {
            include: { model: models_1.User, as: "user" },
        }));
        const targetWaifuSelectId = crypto_1.default.randomBytes(8).toString("hex");
        const targetWaifuSelect = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`dogfight-select-waifu-${targetWaifuSelectId}`)
            .setPlaceholder("Select a waifu"));
        targetUserWaifus.forEach((waifu) => {
            targetWaifuSelect.components[0].addOptions({
                label: `${waifu.name} (ATK: ${waifu.atk} | HP: ${waifu.hp} | SPD: ${waifu.spd})`,
                value: waifu.id.toString(),
            });
        });
        await interaction.editReply({
            content: `<@${targetUser.id}>, select a waifu! If you don't want to dogfight, ignore this message.`,
            components: [targetWaifuSelect],
        });
        const targetWaifuSelectFilter = (i) => i.customId === `dogfight-select-waifu-${targetWaifuSelectId}`;
        const targetWaifuSelectCollector = interaction.channel.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.StringSelect,
            filter: targetWaifuSelectFilter,
            time: 60000,
        });
        targetWaifuSelectCollector.on("collect", async (targetWaifuSelectInteraction) => {
            if (targetWaifuSelectInteraction.user.id !== targetUser.id) {
                await targetWaifuSelectInteraction.reply({
                    content: "You can't select a waifu.",
                    ephemeral: true,
                });
                return;
            }
            await targetWaifuSelectInteraction.deferUpdate();
            targetWaifu = (await models_1.Waifu.findByPk(targetWaifuSelectInteraction.values[0], {
                include: { model: models_1.User, as: "user" },
            }));
            await interaction.editReply({
                content: "Creating a new thread...",
                components: [],
            });
            const channel = interaction.channel;
            const thread = await channel.threads.create({
                name: `${interaction.user.username} vs ${targetUser.username}`,
                autoArchiveDuration: 60,
                reason: "Dogfight",
            });
            await interaction.editReply({
                content: `Thread created! Click here:`,
            });
            const first = [initialWaifu, targetWaifu].sort((a, b) => b.spd - a.spd)[0];
            const second = [initialWaifu, targetWaifu].sort((a, b) => b.spd - a.spd)[1];
            const waifuList = {};
            waifuList[first.id] = {
                atk: first.atk,
                hp: first.hp,
                spd: first.spd,
                // isAttacking: false,
                isEvading: false,
                // isEquipping: false,
                move: "",
                isAbilityUsed: false,
                canEvade: true,
                failedEvade: false,
                isBeingSupported: false,
                isLaunchingBarrage: false,
                isStunned: false,
                hasbeenStunned: false,
            };
            waifuList[second.id] = {
                atk: second.atk,
                hp: second.hp,
                spd: second.spd,
                // isAttacking: false,
                isEvading: false,
                // isEquipping: false,
                move: "",
                isAbilityUsed: false,
                canEvade: true,
                failedEvade: false,
                isBeingSupported: false,
                isLaunchingBarrage: false,
                isStunned: false,
                hasbeenStunned: false,
            };
            const firstWaifu = waifuList[first.id];
            const secondWaifu = waifuList[second.id];
            const firstWaifuData = waifus_json_1.default[first.name];
            const secondWaifuData = waifus_json_1.default[second.name];
            const doCalculations = async (attacker, attackerModel, opponent, opponentModel) => {
                switch (attacker.move) {
                    case "attack": {
                        let dmg = attacker.atk;
                        let isCrit = Math.random() < 0.1;
                        if (!opponent.isEvading &&
                            attacker.equipment?.name !== "HARM" // evade
                        ) {
                            // waifu abilities
                            if (attacker.equipment) {
                                const waifuData = waifus_json_1.default[attacker.equipment
                                    .name];
                                switch (waifuData.ability) {
                                    case "crit": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        isCrit = true;
                                        attacker.isAbilityUsed = true;
                                        break;
                                    }
                                    case "fail-evade": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        if (opponent.failedEvade) {
                                            dmg = Math.ceil(dmg * 1.5);
                                            attacker.isAbilityUsed =
                                                true;
                                        }
                                        break;
                                    }
                                    case "evade": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        if (opponent.isEvading) {
                                            opponent.isEvading = false;
                                            attacker.isAbilityUsed =
                                                true;
                                        }
                                        attacker.isAbilityUsed = true;
                                        break;
                                    }
                                    case "distance": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        attacker.isEvading = true;
                                        attacker.isAbilityUsed = true;
                                        break;
                                    }
                                    case "exclusive": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        break;
                                    }
                                    case "barrage": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        break;
                                    }
                                    case "stun": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        if (opponent.hasbeenStunned)
                                            break;
                                        opponent.isStunned = true;
                                        break;
                                    }
                                    case "heavy": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        isCrit = false;
                                        dmg *= 3;
                                        attacker.isAbilityUsed = true;
                                        break;
                                    }
                                    case "support": {
                                        if (attacker.isAbilityUsed)
                                            break;
                                        attacker.isBeingSupported =
                                            true;
                                        break;
                                    }
                                    default: {
                                        break;
                                    }
                                }
                            }
                            if (!isCrit) {
                                // await thread.send({
                                // 	content: `<@${
                                // 		attackerModel.user.id
                                // 	}> attacked, dealing ${dmg} damage! (${
                                // 		opponentModel.name
                                // 	}: ${opponent.hp} -> **${
                                // 		opponent.hp - dmg
                                // 	}**)`,
                                // });
                                await thread.send({
                                    content: `${attackerModel.name} attack ${dmg}`,
                                });
                            }
                            else {
                                dmg *= 2;
                                // await thread.send({
                                // 	content: `**Critical hit!** <@${
                                // 		attackerModel.user.id
                                // 	}> attacked, dealing ${dmg} damage! (${
                                // 		opponentModel.name
                                // 	}: ${opponent.hp} -> **${
                                // 		opponent.hp - dmg
                                // 	}**)`,
                                // });
                                await thread.send({
                                    content: `${attackerModel.name} crit attack ${dmg}`,
                                });
                            }
                            opponent.hp -= dmg;
                            if (opponent.hp <= 0) {
                                return false;
                            }
                        }
                        else {
                            // await thread.send({
                            // 	content: `<@${attackerModel.user.id}> tried to attack, but <@${opponentModel.user.id}>'s **${opponentModel.name}** evaded!`,
                            // });
                            await thread.send({
                                content: `${attackerModel.name} fail attack b/c evade`,
                            });
                        }
                        break;
                    }
                    case "evade": {
                        if (!attacker.canEvade)
                            break;
                        // Generate a random number between 0 and 1
                        const randomNum = Math.random();
                        // Calculate the probability of returning true based on spd
                        const probability = attacker.spd / 10;
                        // Return true if the random number is less than the probability, otherwise return false
                        if (randomNum < probability) {
                            attacker.isEvading = true;
                            await thread.send({
                                content: `${attackerModel.name} evade`,
                            });
                        }
                        else {
                            // await thread.send({
                            // 	content: `<@${attackerModel.user.id}> tried to evade, but failed!`,
                            // });
                            await thread.send({
                                content: `${attackerModel.name} fail evade`,
                            });
                            attacker.isEvading = false;
                            attacker.failedEvade = true;
                        }
                        break;
                    }
                    case "equip": {
                        const weaponEquipId = crypto_1.default
                            .randomBytes(6)
                            .toString("hex");
                        const weaponEquip = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                            .setCustomId(`dogfight-equip-weapon-${weaponEquipId}`)
                            .setPlaceholder("Select a weapon"));
                        const userWaifus = (await attackerModel.user.getWaifus({
                            where: {
                                hp: 0,
                                spd: 0,
                            },
                        }))
                            .sort((a, b) => b.atk - a.atk)
                            .splice(0, 25);
                        userWaifus.forEach((waifu) => {
                            weaponEquip.components[0].addOptions({
                                label: `${waifu.name} (ATK: ${waifu.atk})`,
                                value: waifu.id.toString(),
                            });
                        });
                        const weaponEquipFilter = (int) => int.customId ===
                            `dogfight-equip-weapon-${weaponEquipId}`;
                        const weaponEquipCollector = thread.createMessageComponentCollector({
                            filter: weaponEquipFilter,
                            time: 30000,
                            componentType: discord_js_1.ComponentType.StringSelect,
                        });
                        const weaponEquipMsg = await thread.send({
                            content: `<@${attackerModel.user.id}>, select a weapon to equip!`,
                            components: [weaponEquip],
                        });
                        const p = await new Promise((r) => {
                            weaponEquipCollector.on("collect", async (int) => {
                                if (int.user.id !==
                                    attackerModel.user.id) {
                                    await int.reply({
                                        content: "You can't make this move.",
                                        ephemeral: true,
                                    });
                                    return;
                                }
                                await weaponEquipMsg.delete();
                                attacker.equipment =
                                    (await models_1.Waifu.findByPk(int.values[0]));
                                attacker.atk +=
                                    attacker.equipment.atk;
                                const equipmentData = waifus_json_1.default[attacker.equipment
                                    .name];
                                const waifuData = waifus_json_1.default[attackerModel.name];
                                if (equipmentData.ability ===
                                    "heavy")
                                    attacker.canEvade = false;
                                if (equipmentData.ability ===
                                    "barrage")
                                    attacker.isLaunchingBarrage =
                                        true;
                                if (equipmentData.ability ===
                                    "exclusive" &&
                                    waifuData.country === "USA")
                                    attacker.atk += Math.ceil(0.5 * attacker.equipment.atk);
                                await thread.send({
                                    content: `<@${attackerModel.user.id}> equipped **${attacker.equipment.name}**, boosting their attack to **${attacker.atk}**!`,
                                });
                                r(true);
                            });
                            weaponEquipCollector.on("end", async (collected) => {
                                if (collected.filter((i) => i.user.id ===
                                    attackerModel.user.id).size === 0) {
                                    await thread.send({
                                        content: `<@${attackerModel.user.id}>'s **${attackerModel.name}** fled!`,
                                    });
                                    attacker.hp = 0;
                                    r(false);
                                }
                            });
                        });
                        if (!p)
                            return false;
                        break;
                    }
                    default: {
                        break;
                    }
                }
                if (opponent.isEvading) {
                    opponent.isEvading = false;
                    return true;
                }
                if (attacker.isLaunchingBarrage) {
                    const atk = Math.ceil((attackerModel.atk + attacker.equipment.atk) *
                        0.5);
                    await thread.send(`<@${attackerModel.user.id}>'s ${attacker.equipment.name} dealt **${atk}** damage to <@${opponentModel.user.id}>'s ${opponentModel.name} from its ongoing barrage! (${opponentModel.name}: ${opponent.hp} -> **${opponent.hp - atk}**)`);
                    opponent.hp -= atk;
                }
                if (attacker.isBeingSupported) {
                    const atk = attacker.equipment.atk * 2;
                    await thread.send(`<@${attackerModel.user.id}>'s ${attacker.equipment.name} dealt **${atk}** damage to <@${opponentModel.user.id}>'s ${opponentModel.name} from its support strike! (${opponentModel.name}: ${opponent.hp} -> **${opponent.hp - atk}**)`);
                    opponent.hp -= atk;
                    attacker.isBeingSupported = false;
                }
                attacker.move = "";
                return true;
            };
            // don't let the while loop continue unless the collector has received a response
            const doMove = (main, mainData, buttonId, collector, turnMsg) => new Promise((resolve) => {
                collector.on("collect", async (i) => {
                    if (i.user.id !== main.user.id) {
                        await i.reply({
                            content: "You can't make this move.",
                            ephemeral: true,
                        });
                        return;
                    }
                    await turnMsg.delete();
                    switch (i.customId) {
                        case `dogfight-attack-${buttonId}`: {
                            // mainData.isAttacking = true;
                            mainData.move = "attack";
                            break;
                        }
                        case `dogfight-evade-${buttonId}`: {
                            // mainData.isEvading = true;
                            mainData.move = "evade";
                            break;
                        }
                        case `dogfight-equip-${buttonId}`: {
                            // mainData.isEquipping = true;
                            mainData.move = "equip";
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                    resolve(true);
                });
                collector.on("end", async (collected) => {
                    if (collected.filter((i) => i.user.id === main.user.id).size === 0) {
                        await thread.send({
                            content: `<@${main.user.id}>'s **${main.name}** fled!`,
                        });
                        mainData.hp = 0;
                        resolve(false);
                    }
                });
            });
            while (firstWaifu.hp > 0 && secondWaifu.hp > 0) {
                if (firstWaifu.isStunned) {
                    await thread.send(`<@${first.user.id}>'s **${first.name}** is stunned!`);
                    firstWaifu.isStunned = false;
                    firstWaifu.hasbeenStunned = true;
                }
                else {
                    const firstWaifuEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(first.name)
                        .setColor(0xff00ff)
                        .setAuthor({
                        name: first.user.username,
                        iconURL: first.user.avatarUrl ?? undefined,
                    })
                        .setImage(`attachment://${firstWaifuData.urlFriendlyName ??
                        first.name}.jpg`)
                        .setDescription("Mission objective: eliminate your opponent.")
                        .addFields({
                        name: "ATK",
                        value: firstWaifu.atk.toString(),
                        inline: true,
                    }, {
                        name: "HP",
                        value: firstWaifu.hp.toString(),
                        inline: true,
                    }, {
                        name: "SPD",
                        value: firstWaifu.spd.toString(),
                        inline: true,
                    }, {
                        name: "Equipped Weapon",
                        value: firstWaifu.equipment?.name
                            ? `${firstWaifu.equipment.name} (+${firstWaifu.equipment.atk.toString()} ATK)`
                            : "None! Equip a weapon for more ATK!",
                        inline: true,
                    });
                    if (firstWaifu.equipment) {
                        const equipmentData = waifus_json_1.default[firstWaifu.equipment
                            .name];
                        firstWaifuEmbed.setThumbnail(`attachment://${equipmentData.urlFriendlyName ??
                            firstWaifu.equipment.name}.jpg`);
                    }
                    const firstDogfightId = crypto_1.default
                        .randomBytes(6)
                        .toString("hex");
                    const firstDogfight = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-attack-${firstDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Danger)
                        .setLabel("Attack"), new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-evade-${firstDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setLabel("Evade"), new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-equip-${firstDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setLabel("Equip a weapon"));
                    if (firstWaifu.equipment ||
                        (await models_1.Waifu.count({
                            where: {
                                userId: first.user.id,
                                hp: 0,
                                spd: 0,
                            },
                        })) === 0)
                        firstDogfight.components[2].setDisabled(true);
                    if (!firstWaifu.canEvade)
                        firstDogfight.components[1].setDisabled(true);
                    const firstDogfightFilter = (i) => i.customId ===
                        `dogfight-attack-${firstDogfightId}` ||
                        i.customId ===
                            `dogfight-evade-${firstDogfightId}` ||
                        i.customId ===
                            `dogfight-equip-${firstDogfightId}`;
                    const firstFiles = [firstWaifuData.path];
                    if (firstWaifu.equipment)
                        firstFiles.push(waifus_json_1.default[firstWaifu.equipment
                            .name].path);
                    const firstTurn = await thread.send({
                        content: `<@${first.user.id}>'s turn with **${first.name}**!`,
                        embeds: [firstWaifuEmbed],
                        components: [firstDogfight],
                        files: firstFiles,
                    });
                    const firstDogfightCollector = thread.createMessageComponentCollector({
                        filter: firstDogfightFilter,
                        time: 30000,
                        componentType: discord_js_1.ComponentType.Button,
                    });
                    const firstResolve = await doMove(first, firstWaifu, firstDogfightId, firstDogfightCollector, firstTurn);
                    if (!firstResolve) {
                        break;
                    }
                }
                if (secondWaifu.isStunned) {
                    await thread.send(`<@${second.user.id}>'s **${second.name}** is stunned!`);
                    secondWaifu.isStunned = false;
                    secondWaifu.hasbeenStunned = true;
                }
                else {
                    const secondWaifuEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(second.name)
                        .setColor(0xff00ff)
                        .setAuthor({
                        name: second.user.username,
                        iconURL: second.user.avatarUrl ?? undefined,
                    })
                        .setImage(`attachment://${secondWaifuData.urlFriendlyName ??
                        second.name}.jpg`)
                        .setDescription("Mission objective: eliminate your opponent.")
                        .addFields({
                        name: "ATK",
                        value: secondWaifu.atk.toString(),
                        inline: true,
                    }, {
                        name: "HP",
                        value: secondWaifu.hp.toString(),
                        inline: true,
                    }, {
                        name: "SPD",
                        value: secondWaifu.spd.toString(),
                        inline: true,
                    }, {
                        name: "Equipped Weapon",
                        value: secondWaifu.equipment?.name
                            ? `${secondWaifu.equipment.name} (+${secondWaifu.equipment.atk.toString()} ATK)`
                            : "None! Equip a weapon for more ATK!",
                        inline: true,
                    });
                    if (secondWaifu.equipment) {
                        const equipmentData = waifus_json_1.default[secondWaifu.equipment
                            .name];
                        secondWaifuEmbed.setThumbnail(`attachment://${equipmentData.urlFriendlyName ??
                            secondWaifu.equipment.name}.jpg`);
                    }
                    const secondDogfightId = crypto_1.default
                        .randomBytes(6)
                        .toString("hex");
                    const secondDogfight = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-attack-${secondDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Danger)
                        .setLabel("Attack"), new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-evade-${secondDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setLabel("Evade"), new discord_js_1.ButtonBuilder()
                        .setCustomId(`dogfight-equip-${secondDogfightId}`)
                        .setStyle(discord_js_1.ButtonStyle.Primary)
                        .setLabel("Equip a weapon"));
                    if (secondWaifu.equipment ||
                        (await models_1.Waifu.count({
                            where: {
                                userId: second.user.id,
                                hp: 0,
                                spd: 0,
                            },
                        })) === 0)
                        secondDogfight.components[2].setDisabled(true);
                    if (!secondWaifu.canEvade)
                        secondDogfight.components[1].setDisabled(true);
                    const secondDogfightFilter = (i) => i.customId ===
                        `dogfight-attack-${secondDogfightId}` ||
                        i.customId ===
                            `dogfight-evade-${secondDogfightId}` ||
                        i.customId ===
                            `dogfight-equip-${secondDogfightId}`;
                    const secondFiles = [secondWaifuData.path];
                    if (secondWaifu.equipment)
                        secondFiles.push(waifus_json_1.default[secondWaifu.equipment
                            .name].path);
                    const secondTurn = await thread.send({
                        content: `<@${second.user.id}>'s turn with **${second.name}**!`,
                        embeds: [secondWaifuEmbed],
                        components: [secondDogfight],
                        files: secondFiles,
                    });
                    const secondDogfightCollector = thread.createMessageComponentCollector({
                        filter: secondDogfightFilter,
                        time: 30000,
                        componentType: discord_js_1.ComponentType.Button,
                    });
                    await doMove(second, secondWaifu, secondDogfightId, secondDogfightCollector, secondTurn).then(async () => {
                        await doCalculations(firstWaifu, first, secondWaifu, second);
                        await doCalculations(secondWaifu, second, firstWaifu, first);
                    });
                }
            }
            if (firstWaifu.hp <= 0) {
                const victorEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(second.name)
                    .setColor(0xff00ff)
                    .setAuthor({
                    name: second.user.username,
                    iconURL: second.user.avatarUrl ?? undefined,
                })
                    .setImage(`attachment://${secondWaifuData.urlFriendlyName ??
                    second.name}.jpg`)
                    .setDescription("You are the victor!");
                if (secondWaifu.equipment) {
                    const equipmentData = waifus_json_1.default[secondWaifu.equipment
                        .name];
                    victorEmbed.setThumbnail(`attachment://${equipmentData.urlFriendlyName ??
                        secondWaifu.equipment.name}.jpg`);
                }
                const content = `<@${first.user.id}>'s **${first.name}** has been defeated! <@${second.user.id}>'s **${second.name}** wins!`;
                const files = [secondWaifuData.path];
                if (secondWaifu.equipment)
                    files.push(waifus_json_1.default[secondWaifu.equipment
                        .name].path);
                await thread.send({
                    content,
                    embeds: [victorEmbed],
                    files,
                });
                await interaction.editReply({
                    content,
                    embeds: [victorEmbed],
                    files,
                });
                await second.update({
                    kills: second.kills + 1,
                });
                await first.update({
                    deaths: first.deaths + 1,
                });
                await second.user.update({
                    dogfightKills: second.user.dogfightKills + 1,
                    dogfightWinstreak: second.user.dogfightWinstreak + 1,
                });
                await first.user.update({
                    dogfightDeaths: first.user.dogfightDeaths + 1,
                    dogfightWinstreak: 0,
                });
            }
            else if (secondWaifu.hp <= 0) {
                const victorEmbed = new discord_js_1.EmbedBuilder()
                    .setTitle(first.name)
                    .setColor(0xff00ff)
                    .setAuthor({
                    name: first.user.username,
                    iconURL: first.user.avatarUrl ?? undefined,
                })
                    .setImage(`attachment://${firstWaifuData.urlFriendlyName ?? first.name}.jpg`)
                    .setDescription("You are the victor!");
                if (firstWaifu.equipment) {
                    const equipmentData = waifus_json_1.default[firstWaifu.equipment
                        .name];
                    victorEmbed.setThumbnail(`attachment://${equipmentData.urlFriendlyName ??
                        firstWaifu.equipment.name}.jpg`);
                }
                const content = `<@${second.user.id}>'s **${second.name}** has been defeated! <@${first.user.id}>'s **${first.name}** wins!`;
                const files = [firstWaifuData.path];
                if (firstWaifu.equipment)
                    files.push(waifus_json_1.default[firstWaifu.equipment
                        .name].path);
                await thread.send({
                    content,
                    embeds: [victorEmbed],
                    files,
                });
                await interaction.editReply({
                    content,
                    embeds: [victorEmbed],
                    files,
                });
                await first.update({
                    kills: first.kills + 1,
                });
                await second.update({
                    deaths: second.deaths + 1,
                });
                await first.user.update({
                    dogfightKills: first.user.dogfightKills + 1,
                    dogfightWinstreak: first.user.dogfightWinstreak + 1,
                });
                await second.user.update({
                    dogfightDeaths: second.user.dogfightDeaths + 1,
                    dogfightWinstreak: 0,
                });
            }
            await thread.setArchived(true);
        });
        targetWaifuSelectCollector.on("end", async (collected) => {
            if (collected.filter((i) => i.user.id === targetUser.id)
                .size === 0) {
                await interaction.editReply({
                    content: "The dogfight was called off.",
                    components: [],
                });
            }
        });
    });
    initialWaifuSelectCollector.on("end", async (collected) => {
        // if (collected.size === 0) {
        if (collected.filter((i) => i.user.id === interaction.user.id).size ===
            0) {
            await interaction.editReply({
                content: "The dogfight was called off.",
                components: [],
            });
        }
    });
}
exports.execute = execute;
