"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const discord_js_1 = require("discord.js");
const models_1 = require("./models");
const config_json_1 = require("./config.json");
const migrations_1 = require("./migrations");
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMembers,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
    presence: {
        status: "online",
        activities: [
            {
                name: "mRAST",
                type: discord_js_1.ActivityType.Competing,
            },
        ],
    },
});
const commands = new discord_js_1.Collection();
const commandsPath = path_1.default.join(__dirname, "commands");
const commandFiles = fs_1.default
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const filePath = path_1.default.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
        commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
client.on(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});
client.on(discord_js_1.Events.GuildCreate, async (guild) => {
    const guildModel = await models_1.Guild.findByPk(guild.id);
    if (guildModel)
        return;
    await models_1.Guild.create({
        id: guild.id,
        name: guild.name,
    });
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    if (interaction.guild === null ||
        interaction.channel instanceof discord_js_1.ThreadChannel) {
        await interaction.reply({
            content: "This command is not available. Please use it in a normal server channel instead.",
            ephemeral: true,
        });
        return;
    }
    const command = commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});
const rest = new discord_js_1.REST({ version: "10" }).setToken(config_json_1.token);
(async () => {
    try {
        const commandsList = commands.map((command) => command.data.toJSON());
        await rest.put(discord_js_1.Routes.applicationCommands(config_json_1.clientId), {
            body: commandsList,
        });
        console.log(`Successfully reloaded ${commandsList.length} application (/) commands.`);
    }
    catch (error) {
        console.error(error);
    }
    await models_1.db.sync();
    client.login(config_json_1.token);
    const guilds = await client.guilds.fetch();
    guilds.forEach(async (guild) => {
        const guildModel = await models_1.Guild.findByPk(guild.id);
        if (guildModel)
            return;
        await models_1.Guild.create({
            id: guild.id,
            name: guild.name,
        });
    });
    await (0, migrations_1.runAllMigrations)();
    //! J0sh is deprecated
    // if (!(await User.findByPk(joshId))) {
    // 	const guild = await Guild.findByPk(guildId);
    // 	if (!guild) return;
    // 	await guild.createUser({
    // 		id: joshId,
    // 		username: joshUsername,
    // 		discriminator: joshDiscriminator,
    // 		avatarUrl: joshAvatarUrl,
    // 		dogfightKills: 999,
    // 		dogfightDeaths: 999,
    // 		dogfightWinstreak: 999,
    // 		airrecQuizWins: 999,
    // 		airrecQuizLosses: 999,
    // 		airrecQuizWinstreak: 999,
    // 		lockedWaifus: Object.keys(waifus),
    // 	});
    // }
})();
