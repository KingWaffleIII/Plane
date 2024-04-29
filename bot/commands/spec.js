import { SlashCommandBuilder } from "discord.js";
export const data = new SlashCommandBuilder()
    .setName("spec")
    .setDescription("Sends a link to the airrec spec, containing both mRAST and RAST.");
export async function execute(interaction) {
    const link = `https://github.com/KingWaffleIII/Plane/blob/dev/aircraft.md`;
    await interaction.reply({
        content: `Click [here](${link}) to view the mRAST and RAST airrec specs.`,
    });
}
