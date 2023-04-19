// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data

import { User, Waifu } from "./models";
import waifus from "./waifus.json";

export async function updateLockedWaifus(): Promise<void> {
	// If there's ever new waifus added, this will add them to the lockedWaifus array.

	// update column default value
	await User.sync({ alter: true });

	(await User.findAll()).forEach(async (user) => {
		const difference = Object.keys(waifus).filter(
			(w) => !user.lockedWaifus.includes(w)
		);

		if (difference.length > 0) {
			difference.forEach(async (w) => {
				const userHasWaifu = await Waifu.findOne({
					where: { userId: user.id, name: w },
				});

				if (!userHasWaifu) {
					await user.update({
						lockedWaifus: [...user.lockedWaifus, w],
					});
				}
			});
		}
	});
}

export async function updateLegacyHornetName(): Promise<void> {
	// As of v1.4.4, the name of the Hornet waifu is changed from "Hornet" to "Super Hornet" for accuracy.

	(await User.findAll()).forEach(async (user) => {
		if (user.lockedWaifus.includes("Hornet")) {
			await user.update({
				lockedWaifus: user.lockedWaifus.map((w) =>
					w === "Hornet" ? "Super Hornet" : w
				),
			});
			return;
		}

		(
			await Waifu.findAll({
				where: { userId: user.id, name: "Hornet" },
			})
		).forEach(async (waifu) => {
			await waifu.update({
				name: "Super Hornet",
			});
		});
	});
}

export async function runAllMigrations(): Promise<void> {
	await updateLegacyHornetName();
	await updateLockedWaifus();
}
