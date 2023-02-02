import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";
import rafk from "../RAFK.json";

const crypto = require("crypto");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("rafk")
		.setDescription("Gives you a question about RAFK.")
		.addIntegerOption((option) =>
			option
				.setName("part")
				.setDescription(
					"The part of RAFK you want to be asked about (1-3). Leave blank for a random part."
				)
				.setMinValue(1)
				.setMaxValue(3)
		)
		.addBooleanOption((option) =>
			option
				.setName("random")
				.setDescription(
					"Whether to use a specific RAFK subject or a random question. Leave blank for a random question."
				)
		),
	async execute(interaction: ChatInputCommandInteraction) {
		// const part =
		// 	interaction.options.getInteger("part") ||
		// 	Math.floor(Math.random() * 3) + 1;
		const part = rafk["1" as keyof typeof rafk];
		const random = interaction.options.getBoolean("random") ?? true;
		const buttonId = crypto.randomBytes(12).toString("hex");
		const selectId = crypto.randomBytes(12).toString("hex");

		await interaction.deferReply();

		let subject =
			part[
				Object.keys(part)[
					(Object.keys(part).length * Math.random()) << 0
				] as keyof typeof part
			];
		let rafkCategory =
			subject[
				Object.keys(subject)[
					(Object.keys(subject).length * Math.random()) << 0
				] as keyof typeof subject
			];
		let randomQuestion =
			rafkCategory[
				(
					Math.floor(Math.random() * rafkCategory["max_questions"]) +
					1
				).toString() as keyof typeof rafkCategory
			];
		const getQuestion = async () => {
			const question =
				randomQuestion["question" as keyof typeof randomQuestion];
			const answer =
				randomQuestion["answer" as keyof typeof randomQuestion];

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`reveal-answer-${buttonId}`)
					.setLabel("Reveal answer")
					.setStyle(ButtonStyle.Primary)
			);
			await interaction.editReply({
				content: question,
				components: [row],
			});

			const filter = (i: any) =>
				i.customId === `reveal-answer-${buttonId}`;
			const collector =
				interaction.channel?.createMessageComponentCollector({
					time: 30000,
					filter,
				});
			collector?.on("collect", async (i: ButtonInteraction) => {
				if (i.user.id !== interaction.user.id) {
					await i.reply({
						content:
							"You can't reveal the answer to this question.",
						ephemeral: true,
					});
				} else {
					await interaction.editReply({
						content: `${question}\n**${answer}**`,
						components: [],
					});
				}
			});
		};

		if (!random) {
			const row =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId(`select-subject-${selectId}`)
						.setPlaceholder("Select a subject")
				);
			for (const subj in part) {
				if (Object.prototype.hasOwnProperty.call(part, subj)) {
					row.components[0].addOptions({
						label: subj,
						value: subj,
					});
				}
			}
			await interaction.editReply({
				components: [row],
			});

			const filter = (i: any) =>
				i.customId === `select-subject-${selectId}`;
			const collector =
				interaction.channel?.createMessageComponentCollector({
					time: 10000,
					filter,
				});
			collector?.on("collect", async (i: StringSelectMenuInteraction) => {
				if (i.user.id !== interaction.user.id) {
					await i.reply({
						content: "You can't select a subject.",
						ephemeral: true,
					});
				} else {
					subject = part[i.values[0] as keyof typeof part];
					rafkCategory =
						subject[
							Object.keys(subject)[
								(Object.keys(subject).length * Math.random()) <<
									0
							] as keyof typeof subject
						];
					randomQuestion =
						rafkCategory[
							(
								Math.floor(
									Math.random() *
										rafkCategory["max_questions"]
								) + 1
							).toString() as keyof typeof rafkCategory
						];

					await i.deferUpdate();
					await getQuestion();
				}
			});
		} else {
			await getQuestion();
		}
	},
};
