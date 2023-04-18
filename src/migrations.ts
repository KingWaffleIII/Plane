// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data

import { User, Waifu } from "./models";
import waifus from "./waifus.json";

export async function updateLockedWaifus(): Promise<void> {
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

export async function runAllMigrations(): Promise<void> {
	await updateLockedWaifus();
}
