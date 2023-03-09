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
    .setName("target")
    .setDescription("Select a waifu to get from the guarantee system.")
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name of the waifu you want to target.")
    .setRequired(true));
async function execute(interaction) {
    const name = interaction.options.getString("name");
    await interaction.deferReply();
    const user = await models_1.User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.editReply({
            content: `You don't have waifu collection yet! Use \`/waifus\` to create one!`,
        });
        return;
    }
    const waifusLowerCase = Object.keys(waifus_json_1.default).map((w) => w.toLowerCase());
    if (!waifusLowerCase.includes(name.toLowerCase())) {
        await interaction.editReply({
            content: "That waifu doesn't exist!",
        });
        return;
    }
    const waifuName = Object.keys(waifus_json_1.default)[waifusLowerCase.indexOf(name.toLowerCase())];
    if ((await user.countWaifus({
        where: {
            name: waifuName,
        },
    })) > 5) {
        await interaction.editReply({
            content: `You already have 5 copies of ${waifuName}!`,
        });
        return;
    }
    await user.update({
        guaranteeWaifu: waifuName,
        guaranteeCounter: user.guaranteeCounter ?? 0,
    });
    await interaction.editReply({
        content: `You have successfully targeted ${waifuName}! You will be guaranteed get this waifu after 10 waifus, if not earlier. This has not reset your counter.`,
    });
}
exports.execute = execute;
