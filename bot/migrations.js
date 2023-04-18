"use strict";
// DB migrations to update users using old data
// On DB changes, e.g. a new field for User is added, migrations should be made to update users' data
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAllMigrations = exports.updateLockedWaifus = void 0;
const models_1 = require("./models");
const waifus_json_1 = __importDefault(require("./waifus.json"));
async function updateLockedWaifus() {
    // update column default value
    await models_1.User.sync({ alter: true });
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
async function runAllMigrations() {
    await updateLockedWaifus();
}
exports.runAllMigrations = runAllMigrations;
