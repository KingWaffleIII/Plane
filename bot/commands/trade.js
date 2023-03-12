"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.data = void 0;
const crypto_1 = __importDefault(require("crypto"));
const discord_js_1 = require("discord.js");
const models_1 = require("../models");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName("trade")
    .setDescription("Starts a waifu trade with another user.")
    .addUserOption((option) => option
    .setName("user")
    .setDescription("The user you want to trade with.")
    .setRequired(true));
async function execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    await interaction.deferReply();
    const initialUserModel = await models_1.User.findByPk(interaction.user.id);
    const targetUserModel = await models_1.User.findByPk(targetUser.id);
    if (!initialUserModel || !targetUserModel) {
        await interaction.followUp({
            content: "**Either you or the user you want to trade with don't have waifu collections yet! Use `/waifus` to create one!**",
        });
        return;
    }
    let initialUserWaifus = (await initialUserModel.getWaifus())
        .sort((a, b) => b.atk - a.atk)
        .splice(0, 25); // discord only allows 25 items
    let initialWaifu;
    let targetUserWaifus = (await targetUserModel.getWaifus())
        .sort((a, b) => b.atk - a.atk)
        .splice(0, 25); // discord only allows 25 items
    let targetWaifu;
    if (initialUserWaifus.length === 0 || targetUserWaifus.length === 0) {
        await interaction.followUp({
            content: "Either you or the user you want to trade with don't have any waifus!",
        });
        return;
    }
    const initialWaifuSelectId = crypto_1.default.randomBytes(6).toString("hex");
    const initialWaifuSelectRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(`trade-select-waifu-${initialWaifuSelectId}`)
        .setPlaceholder("Select a waifu to trade"));
    const initialWaifuList = [];
    initialUserWaifus.forEach((waifu) => {
        if (!initialWaifuList.includes(waifu.name))
            initialWaifuList.push(waifu.name);
    });
    initialWaifuList.forEach((waifu) => {
        initialWaifuSelectRow.components[0].addOptions({
            label: waifu,
            value: waifu,
        });
    });
    await interaction.editReply({
        content: `<@${interaction.user.id}>, which waifu do you want to trade? **You will be able to confirm after.**`,
        components: [initialWaifuSelectRow],
    });
    const initialWaifuSelectFilter = (i) => i.customId === `trade-select-waifu-${initialWaifuSelectId}`;
    const initialWaifuSelectCollector = interaction.channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.StringSelect,
        filter: initialWaifuSelectFilter,
        time: 30000,
    });
    initialWaifuSelectCollector.on("collect", async (initialWaifuSelectInteraction) => {
        if (initialWaifuSelectInteraction.user.id !== interaction.user.id) {
            await initialWaifuSelectInteraction.reply({
                content: "You can't select this waifu.",
                ephemeral: true,
            });
            return;
        }
        await initialWaifuSelectInteraction.deferUpdate();
        const initialCopySelectId = crypto_1.default.randomBytes(6).toString("hex");
        const initialCopySelectRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
            .setCustomId(`trade-select-copy-${initialCopySelectId}`)
            .setPlaceholder("Select a copy to trade"));
        initialUserWaifus = (await initialUserModel.getWaifus({
            where: {
                name: initialWaifuSelectInteraction.values[0],
            },
        }))
            .sort((a, b) => b.atk - a.atk)
            .splice(0, 25); // discord only allows 25 items
        initialUserWaifus.forEach((waifu) => {
            initialCopySelectRow.components[0].addOptions({
                label: `${waifu.name} (ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd})`,
                value: waifu.id.toString(),
            });
        });
        await interaction.editReply({
            content: `<@${interaction.user.id}>, which copy of **${initialWaifuSelectInteraction.values[0]}** do you want to trade? **You will be able to confirm after.**`,
            components: [initialCopySelectRow],
        });
        const initialCopySelectFilter = (i) => i.customId === `trade-select-copy-${initialCopySelectId}`;
        const initialCopySelectCollector = interaction.channel.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.StringSelect,
            filter: initialCopySelectFilter,
            time: 30000,
        });
        initialCopySelectCollector.on("collect", async (initialCopySelectInteraction) => {
            if (initialCopySelectInteraction.user.id !==
                interaction.user.id) {
                await initialCopySelectInteraction.reply({
                    content: "You can't select this waifu.",
                    ephemeral: true,
                });
                return;
            }
            await initialCopySelectInteraction.deferUpdate();
            initialWaifu = (await models_1.Waifu.findByPk(initialCopySelectInteraction.values[0]));
            const targetWaifuSelectId = crypto_1.default
                .randomBytes(6)
                .toString("hex");
            const targetWaifuSelectRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                .setCustomId(`trade-select-waifu-${targetWaifuSelectId}`)
                .setPlaceholder("Select a waifu to trade"));
            const targetWaifuList = [];
            targetUserWaifus.forEach((waifu) => {
                if (!targetWaifuList.includes(waifu.name))
                    targetWaifuList.push(waifu.name);
            });
            targetWaifuList.forEach((waifu) => {
                targetWaifuSelectRow.components[0].addOptions({
                    label: waifu,
                    value: waifu,
                });
            });
            await interaction.editReply({
                content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which waifu do you want to trade? **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
                components: [targetWaifuSelectRow],
            });
            const targetWaifuSelectFilter = (select) => select.customId ===
                `trade-select-waifu-${targetWaifuSelectId}`;
            const targetWaifuSelectCollector = interaction.channel.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.StringSelect,
                filter: targetWaifuSelectFilter,
                time: 30000,
            });
            targetWaifuSelectCollector.on("collect", async (targetWaifuSelectInteraction) => {
                if (targetWaifuSelectInteraction.user.id !==
                    targetUser.id) {
                    await targetWaifuSelectInteraction.reply({
                        content: "You can't select this waifu.",
                        ephemeral: true,
                    });
                    return;
                }
                await targetWaifuSelectInteraction.deferUpdate();
                const targetCopySelectId = crypto_1.default
                    .randomBytes(6)
                    .toString("hex");
                const targetCopySelectRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                    .setCustomId(`trade-select-copy-${targetCopySelectId}`)
                    .setPlaceholder("Select a copy to trade"));
                targetUserWaifus = (await targetUserModel.getWaifus({
                    where: {
                        name: targetWaifuSelectInteraction
                            .values[0],
                    },
                }))
                    .sort((a, b) => b.atk - a.atk)
                    .splice(0, 25); // discord only allows 25 items
                targetUserWaifus.forEach((waifu) => {
                    targetCopySelectRow.components[0].addOptions({
                        label: `${waifu.name} (ATK:${waifu.atk} | HP:${waifu.hp} | SPD:${waifu.spd})`,
                        value: waifu.id.toString(),
                    });
                });
                await interaction.editReply({
                    content: `<@${targetUser.id}>, <@${interaction.user.id}> wants to trade **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Which copy of **${targetWaifuSelectInteraction.values[0]}** do you want to trade? **You will not be able to confirm after!** If you don't want to trade, ignore this message.`,
                    components: [targetCopySelectRow],
                });
                const targetCopySelectFilter = (i) => i.customId ===
                    `trade-select-copy-${targetCopySelectId}`;
                const targetCopySelectCollector = interaction.channel.createMessageComponentCollector({
                    componentType: discord_js_1.ComponentType.StringSelect,
                    filter: targetCopySelectFilter,
                    time: 30000,
                });
                targetCopySelectCollector.on("collect", async (targetCopySelectInteraction) => {
                    if (targetCopySelectInteraction.user.id !==
                        targetUser.id) {
                        await targetCopySelectInteraction.reply({
                            content: "You can't select this waifu.",
                            ephemeral: true,
                        });
                    }
                    await targetCopySelectInteraction.deferUpdate();
                    targetWaifu = (await models_1.Waifu.findByPk(targetCopySelectInteraction.values[0]));
                    const confirmTradeId = crypto_1.default
                        .randomBytes(6)
                        .toString("hex");
                    const confirmTradeRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(`trade-confirm-${confirmTradeId}`)
                        .setLabel("Confirm")
                        .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
                        .setCustomId(`trade-cancel-${confirmTradeId}`)
                        .setLabel("Cancel")
                        .setStyle(discord_js_1.ButtonStyle.Danger));
                    await interaction.editReply({
                        content: `<@${interaction.user.id}>, <@${targetUser.id}> wants to trade **${targetWaifu.name} (ATK: ${targetWaifu.atk} | HP: ${targetWaifu.hp} | SPD: ${targetWaifu.spd})** for **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})**! Do you want to confirm this trade? **This is irreversible!**`,
                        components: [confirmTradeRow],
                    });
                    const confirmTradeFilter = (i) => i.customId ===
                        `trade-confirm-${confirmTradeId}` ||
                        i.customId ===
                            `trade-cancel-${confirmTradeId}`;
                    const confirmTradeCollector = interaction.channel.createMessageComponentCollector({
                        componentType: discord_js_1.ComponentType.Button,
                        filter: confirmTradeFilter,
                        time: 30000,
                    });
                    confirmTradeCollector.on("collect", async (confirmTradeInteraction) => {
                        if (confirmTradeInteraction.user
                            .id !== interaction.user.id) {
                            await confirmTradeInteraction.reply({
                                content: "You can't confirm this trade.",
                                ephemeral: true,
                            });
                            return;
                        }
                        await confirmTradeInteraction.deferUpdate();
                        if (confirmTradeInteraction.customId ===
                            `trade-confirm-${confirmTradeId}`) {
                            await initialUserModel.removeWaifu(initialWaifu);
                            await targetUserModel.removeWaifu(targetWaifu);
                            await initialUserModel.addWaifu(targetWaifu);
                            await targetUserModel.addWaifu(initialWaifu);
                            await interaction.editReply({
                                content: `<@${interaction.user.id}> has successfully traded their **${initialWaifu.name} (ATK: ${initialWaifu.atk} | HP: ${initialWaifu.hp} | SPD: ${initialWaifu.spd})** for <@${targetUser.id}>'s **${targetWaifu.name} (ATK: ${targetWaifu.atk} | HP: ${targetWaifu.hp} | SPD: ${targetWaifu.spd})**!`,
                                components: [],
                            });
                            confirmTradeCollector.stop();
                            targetCopySelectCollector.stop();
                            targetWaifuSelectCollector.stop();
                            initialCopySelectCollector.stop();
                            initialWaifuSelectCollector.stop();
                        }
                        else {
                            await interaction.editReply({
                                content: "This trade has been cancelled.",
                                components: [],
                            });
                            confirmTradeCollector.stop();
                            targetCopySelectCollector.stop();
                            targetWaifuSelectCollector.stop();
                            initialCopySelectCollector.stop();
                            initialWaifuSelectCollector.stop();
                        }
                    });
                    confirmTradeCollector.on("end", async (collected) => {
                        if (collected.size === 0) {
                            await interaction.editReply({
                                content: "This trade has been cancelled.",
                                components: [],
                            });
                        }
                    });
                });
                targetCopySelectCollector.on("end", async (collected) => {
                    if (collected.size === 0) {
                        await interaction.editReply({
                            content: "This trade has been cancelled.",
                            components: [],
                        });
                    }
                });
            });
            targetWaifuSelectCollector.on("end", async (collected) => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: "This trade has been cancelled.",
                        components: [],
                    });
                }
            });
        });
        initialCopySelectCollector.on("end", async (collected) => {
            if (collected.size === 0) {
                await interaction.editReply({
                    content: "This trade has been cancelled.",
                    components: [],
                });
            }
        });
    });
    initialWaifuSelectCollector.on("end", async (collected) => {
        if (collected.size === 0) {
            await interaction.editReply({
                content: "This trade has been cancelled.",
                components: [],
            });
        }
    });
}
exports.execute = execute;
