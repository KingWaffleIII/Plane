import fs from "fs";
import path, { dirname } from "path";
import {
	ActivityType,
	ChatInputCommandInteraction,
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	Interaction,
	REST,
	Routes,
	SlashCommandBuilder,
	ThreadChannel,
} from "discord.js";
import { fileURLToPath } from "url";

import { db } from "./models.js";
import config from "./config.json" with { type: "json" };

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const client: Client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	presence: {
		status: "online",
		activities: [
			{
				name: "RAST",
				type: ActivityType.Competing,
			},
		],
	},
});

const commands: Collection<string, Command> = new Collection();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command: Command = await import(filePath);
	if ("data" in command && "execute" in command) {
		commands.set(command.data.name, command);
	} else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
		);
	}
}

client.on(Events.ClientReady, (bot) => {
	console.log(`Bot is ready, logged in as ${bot.user.tag}!`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;
	if (
		interaction.guild === null ||
		interaction.channel instanceof ThreadChannel
	) {
		await interaction.reply({
			content:
				"This command is not available. Please use it in a normal server channel instead.",
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

const { clientId, token } = config;

const rest = new REST({ version: "10" }).setToken(token);
try {
	const commandsList: Array<object> = commands.map((command) =>
		command.data.toJSON()
	);

	await rest.put(Routes.applicationCommands(clientId), {
		body: commandsList,
	});

	console.log(
		`Successfully reloaded ${commandsList.length} application (/) command(s).`
	);
} catch (error) {
	console.error(error);
}

await db.sync();

await client.login(token);
