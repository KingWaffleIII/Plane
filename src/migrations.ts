// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data

import { db, User, Waifu } from "./models.js";
import waifus from "./waifus.json" assert { type: "json" };

export async function updateLockedWaifus(): Promise<void> {
	// If there's ever new waifus added, this will add them to the lockedWaifus array.

	// update column default value
	await User.sync({
		alter: {
			drop: false,
		},
	});

	for (const user of await User.findAll()) {
		const difference = Object.keys(waifus).filter(
			(w) => !user.lockedWaifus.includes(w)
		);

		if (difference.length > 0) {
			for (const w of difference) {
				const userHasWaifu = await Waifu.findOne({
					where: { userId: user.id, name: w },
				});

				if (!userHasWaifu) {
					await user.update({
						lockedWaifus: [...user.lockedWaifus, w],
					});
				}
			}
		}
	}
}

export async function updateLegacyHornetName(): Promise<void> {
	// As of v1.4.4, the name of the Hornet waifu is changed from "Hornet" to "Super Hornet" for accuracy.

	for (const user of await User.findAll()) {
		if (user.lockedWaifus.includes("Hornet")) {
			await user.update({
				lockedWaifus: user.lockedWaifus.map((w) =>
					w === "Hornet" ? "Super Hornet" : w
				),
			});
			continue;
		}

		for (const waifu of await Waifu.findAll({
			where: { userId: user.id, name: "Hornet" },
		})) {
			await waifu.update({
				name: "Super Hornet",
			});
		}
	}
}

export async function deleteGuildModel(): Promise<void> {
	// As of v1.4.4, Guilds are no longer used. This function deletes the Guild model from the DB.
	await db.getQueryInterface().dropTable("Guilds");
}

export async function updateSpecWaifus(): Promise<void> {
	// Some waifus' spec status may have changed. This function updates the spec status of all users' waifus.

	for (const user of await User.findAll()) {
		for (const w of await Waifu.findAll({ where: { userId: user.id } })) {
			if (waifus[w.name as keyof typeof waifus].spec) {
				await w.update({
					spec: true,
				});
			} else {
				await w.update({
					spec: false,
				});
			}
		}
	}
}

export async function runAllMigrations(): Promise<void> {
	await deleteGuildModel();
	await updateLegacyHornetName();
	await updateLockedWaifus();
	await updateSpecWaifus();
}
