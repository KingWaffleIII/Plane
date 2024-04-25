import crypto from "crypto";
import { ActionRowBuilder, ComponentType, SlashCommandBuilder, StringSelectMenuBuilder, } from "discord.js";
import { User, Waifu } from "../models.js";
import waifus from "../waifus.json" assert { type: "json" };
export const data = new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Deletes a (copy of) a waifu.")
    .addStringOption((option) => option
    .setName("name")
    .setDescription("The name of the waifu you want to delete.")
    .setRequired(true));
export async function execute(interaction) {
    const name = interaction.options.getString("name");
    await interaction.deferReply({
        ephemeral: true,
    });
    const user = await User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.followUp({
            content: "You don't have a profile yet. Use `/waifus` or `/stats` first.",
        });
    }
    const waifusLowerCase = Object.keys(waifus).map((w) => w.toLowerCase());
    if (!waifusLowerCase.includes(name.toLowerCase())) {
        await interaction.editReply({
            content: "That waifu doesn't exist!",
        });
        return;
    }
    const waifuName = Object.keys(waifus)[waifusLowerCase.indexOf(name.toLowerCase())];
    const userWaifus = await user.getWaifus({
        where: {
            name: waifuName,
        },
    });
    if (userWaifus.length === 0) {
        await interaction.editReply({
            content: `You don't have a copy of ${waifuName}!`,
        });
        return;
    }
    const selectId = crypto.randomBytes(6).toString("hex");
    const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder()
        .setCustomId(`delete-waifu-${selectId}`)
        .setPlaceholder("Select a copy to delete"));
    userWaifus.forEach((waifu) => {
        row.components[0].addOptions({
            label: `${waifu.name} (ATK: ${waifu.atk} | HP: ${waifu.hp} | SPD: ${waifu.spd})`,
            value: waifu.id.toString(),
        });
    });
    await interaction.editReply({
        content: `Which copy of ${waifuName} do you want to delete? **This action is irreversible and you will not get a confirmation!**`,
        components: [row],
    });
    const filter = (i) => i.customId === `delete-waifu-${selectId}`;
    const collector = interaction.channel?.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter,
        time: 30000,
    });
    collector?.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
            await i.reply({
                content: "You can't delete this waifu.",
                ephemeral: true,
            });
            return;
        }
        const waifu = await Waifu.findByPk(i.values[0]);
        await waifu.destroy();
        await interaction.editReply({
            content: `You have successfully deleted your copy of ${waifu.name}!`,
            components: [],
        });
    });
}
