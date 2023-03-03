import { SlashCommandBuilder } from "discord.js";

export interface Command {
	data: SlashCommandBuilder;
	execute: (interaction: unknown) => Promise<void>;
}

export interface Question {
	question: string;
	answer: string;
}
export interface Aircraft {
	readonly name: string;
	readonly role: string;
	readonly manufacturer: string;
	readonly model: string;
	readonly aliases: string[];
	readonly identification: string[];
	readonly image: string;
	readonly waifuImage?: string;
	readonly wiki: string;
}

export interface Waifu {
	readonly path: string;
	readonly urlFriendlyName?: string;
	readonly type: string;
	readonly spec: boolean; // if the aircraft is obtainable via /airrec
}

export interface WaifuEmbedData {
	name: string;
	urlFriendlyName: string;
	path: string;
}
