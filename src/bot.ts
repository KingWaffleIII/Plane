import * as fs from "fs";
import * as path from "path";

import {
	ActivityType,
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	Interaction,
	REST,
	Routes,
	SlashCommandBuilder,
} from "discord.js";
import { Sequelize } from "sequelize";
import { db, clientId, plugins, token } from "./config.json";

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	presence: {
		status: "online",
		activities: [
			{
				name: "mRAST",
				type: ActivityType.Competing,
			},
		],
	},
});

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: unknown) => Promise<void>;
}

interface GuildCommands {
	[guildId: string]: {
		[commandName: string]: Command;
	};
}

const commands: Collection<string, Command> = new Collection();
const guildCommands: GuildCommands = {};
const sequelize = new Sequelize(db);

for (const plugin of plugins) {
	const commandsPath = path.join(__dirname, plugin, "commands");
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".js"));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command: Command = require(filePath);
		if ("data" in command && "execute" in command) {
			if (fs.existsSync(path.join(__dirname, plugin, "plugin.json"))) {
				const config = require(path.join(
					__dirname,
					plugin,
					"plugin.json"
				));
				guildCommands[config.guildId][command.data.name] = command;
			} else {
				commands.set(command.data.name, command);
			}
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
			);
		}
	}

	if (fs.existsSync(path.join(__dirname, plugin, "models.js"))) {
		const models = require(path.join(__dirname, plugin, "models.js"));
		for (const model of models.models) {
			sequelize.define(model.name, model.model);
		}
	}
}

client.on(Events.ClientReady, (bot) => {
	console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;
	if (interaction.guild === null) {
		await interaction.reply({
			content:
				"This command is not available in DMs. Please use it in a server instead.",
			ephemeral: true,
		});
		return;
	}

	const command = commands.get(interaction.commandName);

	if (!command) {
		console.error(
			`No command matching ${interaction.commandName} was found.`
		);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "There was an error while executing this command!",
			ephemeral: true,
		});
	}
});

const rest = new REST({ version: "10" }).setToken(token);
(async () => {
	try {
		const commandsList: Array<object> = commands.map((command) =>
			command.data.toJSON()
		);

		await rest.put(Routes.applicationCommands(clientId), {
			body: commandsList,
		});

		console.log(
			`Successfully reloaded ${commandsList.length} application (/) commands.`
		);

		const promises: Array<Promise<unknown>> = [];
		for (const guildId in guildCommands) {
			if (Object.prototype.hasOwnProperty.call(guildCommands, guildId)) {
				const guildCommandsList: Array<object> = Object.values(
					guildCommands[guildId]
				).map((command) => command.data.toJSON());

				promises.push(
					rest.put(
						Routes.applicationGuildCommands(clientId, guildId),
						{
							body: guildCommandsList,
						}
					)
				);

				console.log(
					`Successfully reloaded ${guildCommandsList.length} guild (/) commands for guild ${guildId}.`
				);
			}
		}

		await Promise.all(promises);
	} catch (error) {
		console.error(error);
	}

	client.login(token);
})();
