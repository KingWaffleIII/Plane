"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const discord_js_1 = require("discord.js");
const sequelize_1 = require("sequelize");
const config_json_1 = require("./config.json");
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
const guildCommands = {};
const sequelize = new sequelize_1.Sequelize(config_json_1.db);
for (const plugin of config_json_1.plugins) {
    const commandsPath = path.join(__dirname, plugin, "commands");
    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            if (fs.existsSync(path.join(__dirname, plugin, "plugin.json"))) {
                const config = require(path.join(__dirname, plugin, "plugin.json"));
                guildCommands[config.guildId][command.data.name] = command;
            }
            else {
                commands.set(command.data.name, command);
            }
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
    if (fs.existsSync(path.join(__dirname, plugin, "models.js"))) {
        const models = require(path.join(__dirname, plugin, "models.js"));
        for (const model of models.models) {
            sequelize.define(model.name, model.model);
        }
    }
}
client.on(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    if (interaction.guild === null) {
        await interaction.reply({
            content: "This command is not available in DMs. Please use it in a server instead.",
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
        const promises = [];
        for (const guildId in guildCommands) {
            if (Object.prototype.hasOwnProperty.call(guildCommands, guildId)) {
                const guildCommandsList = Object.values(guildCommands[guildId]).map((command) => command.data.toJSON());
                promises.push(rest.put(discord_js_1.Routes.applicationGuildCommands(config_json_1.clientId, guildId), {
                    body: guildCommandsList,
                }));
                console.log(`Successfully reloaded ${guildCommandsList.length} guild (/) commands for guild ${guildId}.`);
            }
        }
        await Promise.all(promises);
    }
    catch (error) {
        console.error(error);
    }
    client.login(config_json_1.token);
})();
