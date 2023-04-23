"use strict";
// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllMigrations = exports.updateSpecWaifus = exports.deleteGuildModel = exports.updateLegacyHornetName = exports.updateLockedWaifus = void 0;
const models_1 = require("./models");
const waifus_json_1 = __importDefault(require("./waifus.json"));
async function updateLockedWaifus() {
    // If there's ever new waifus added, this will add them to the lockedWaifus array.
    // update column default value
    await models_1.User.sync({
        alter: {
            drop: false,
        },
    });
    (await models_1.User.findAll()).forEach(async (user) => {
        const difference = Object.keys(waifus_json_1.default).filter((w) => !user.lockedWaifus.includes(w));
        if (difference.length > 0) {
            difference.forEach(async (w) => {
                const userHasWaifu = await models_1.Waifu.findOne({
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
exports.updateLockedWaifus = updateLockedWaifus;
async function updateLegacyHornetName() {
    // As of v1.4.4, the name of the Hornet waifu is changed from "Hornet" to "Super Hornet" for accuracy.
    (await models_1.User.findAll()).forEach(async (user) => {
        if (user.lockedWaifus.includes("Hornet")) {
            await user.update({
                lockedWaifus: user.lockedWaifus.map((w) => w === "Hornet" ? "Super Hornet" : w),
            });
            return;
        }
        (await models_1.Waifu.findAll({
            where: { userId: user.id, name: "Hornet" },
        })).forEach(async (waifu) => {
            await waifu.update({
                name: "Super Hornet",
            });
        });
    });
}
exports.updateLegacyHornetName = updateLegacyHornetName;
async function deleteGuildModel() {
    // As of v1.4.4, Guilds are no longer used. This function deletes the Guild model from the DB.
    await models_1.db.getQueryInterface().dropTable("Guilds");
}
exports.deleteGuildModel = deleteGuildModel;
async function updateSpecWaifus() {
    // Some waifus' spec status may have changed. This function updates the spec status of all users' waifus.
    (await models_1.User.findAll()).forEach(async (user) => {
        (await models_1.Waifu.findAll({ where: { userId: user.id } })).forEach(async (w) => {
            if (waifus_json_1.default[w.name].spec) {
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
exports.updateSpecWaifus = updateSpecWaifus;
async function runAllMigrations() {
    await deleteGuildModel();
    await updateLegacyHornetName();
    await updateLockedWaifus();
    await updateSpecWaifus();
}
exports.runAllMigrations = runAllMigrations;
