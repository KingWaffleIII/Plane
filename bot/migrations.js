// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data
import { db, User, Waifu } from "./models.js";
import waifus from "./waifus.json" assert { type: "json" };
export async function updateLockedWaifus() {
    // If there's ever new waifus added, this will add them to the lockedWaifus array.
    // update column default value
    await User.sync({
        alter: {
            drop: false,
        },
    });
    (await User.findAll()).forEach(async (user) => {
        const difference = Object.keys(waifus).filter((w) => !user.lockedWaifus.includes(w));
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
export async function updateLegacyHornetName() {
    // As of v1.4.4, the name of the Hornet waifu is changed from "Hornet" to "Super Hornet" for accuracy.
    (await User.findAll()).forEach(async (user) => {
        if (user.lockedWaifus.includes("Hornet")) {
            await user.update({
                lockedWaifus: user.lockedWaifus.map((w) => w === "Hornet" ? "Super Hornet" : w),
            });
            return;
        }
        (await Waifu.findAll({
            where: { userId: user.id, name: "Hornet" },
        })).forEach(async (waifu) => {
            await waifu.update({
                name: "Super Hornet",
            });
        });
    });
}
export async function deleteGuildModel() {
    // As of v1.4.4, Guilds are no longer used. This function deletes the Guild model from the DB.
    await db.getQueryInterface().dropTable("Guilds");
}
export async function updateSpecWaifus() {
    // Some waifus' spec status may have changed. This function updates the spec status of all users' waifus.
    (await User.findAll()).forEach(async (user) => {
        (await Waifu.findAll({ where: { userId: user.id } })).forEach(async (w) => {
            if (waifus[w.name].spec) {
                await w.update({
                    spec: true,
                });
            }
            else {
                await w.update({
                    spec: false,
                });
            }
        });
    });
}
export async function runAllMigrations() {
    await deleteGuildModel();
    await updateLegacyHornetName();
    await updateLockedWaifus();
    await updateSpecWaifus();
}
