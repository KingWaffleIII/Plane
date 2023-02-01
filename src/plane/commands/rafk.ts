import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
} from "discord.js";
import rafk from "../RAFK.json";

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
		// 	Math.floor(Math.random() * 3) + 1;r
		const part = rafk["1" as keyof typeof rafk];
		const random = interaction.options.getBoolean("random") ?? true;

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
					Math.floor(Math.random() * rafkCategory.max_questions) + 1
				).toString() as keyof typeof rafkCategory
			];
		const getQuestion = async () => {
			const question =
				randomQuestion["question" as keyof typeof randomQuestion];
			const answer =
				randomQuestion["answer" as keyof typeof randomQuestion];

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId("reveal-answer")
					.setLabel("Reveal answer")
					.setStyle(ButtonStyle.Primary)
			);
			await interaction.editReply({
				content: question,
				components: [row],
			});

			const filter = (i: any) =>
				i.customId === "reveal-answer" &&
				i.user.id === interaction.user.id;
			const collector =
				interaction.channel?.createMessageComponentCollector({
					max: 1,
					time: 10000,
					filter,
				});
			collector?.on("collect", () => {
				interaction.editReply({
					content: `${question}\n**${answer}**`,
					components: [],
				});
			});
		};

		if (!random) {
			const row =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("select-subject")
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
				content: "Select a subject.",
				components: [row],
			});

			const filter = (i: any) =>
				i.customId === "select-subject" &&
				i.user.id === interaction.user.id;
			const collector =
				interaction.channel?.createMessageComponentCollector({
					max: 1,
					time: 10000,
					filter,
				});
			collector?.on("collect", async (i: StringSelectMenuInteraction) => {
				subject = part[i.values[0] as keyof typeof part];
				rafkCategory =
					subject[
						Object.keys(subject)[
							(Object.keys(subject).length * Math.random()) << 0
						] as keyof typeof subject
					];
				randomQuestion =
					rafkCategory[
						(
							Math.floor(
								Math.random() * rafkCategory.max_questions
							) + 1
						).toString() as keyof typeof rafkCategory
					];

				await getQuestion();
			});
		} else {
			await getQuestion();
		}
	},
};
