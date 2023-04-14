import fs from "fs";
import path from "path";
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
	ThreadChannel,
} from "discord.js";

import { db, Guild } from "./models";
import { clientId, token } from "./config.json";
import { runAllMigrations } from "./migrations";

interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: unknown) => Promise<void>;
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
				name: "mRAST",
				type: ActivityType.Competing,
			},
		],
	},
});

const commands: Collection<string, Command> = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command: Command = require(filePath);
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

client.on(Events.GuildCreate, async (guild) => {
	const guildModel = await Guild.findByPk(guild.id);
	if (guildModel) return;
	await Guild.create({
		id: guild.id,
		name: guild.name,
	});
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
	} catch (error) {
		console.error(error);
	}

	await db.sync();

	client.login(token);

	const guilds = await client.guilds.fetch();
	guilds.forEach(async (guild) => {
		const guildModel = await Guild.findByPk(guild.id);
		if (guildModel) return;
		await Guild.create({
			id: guild.id,
			name: guild.name,
		});
	});

	await runAllMigrations();

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
