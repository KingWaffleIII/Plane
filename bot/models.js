"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.Models = exports.db = void 0;
const sequelize_1 = require("sequelize");
exports.db = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "./db.sqlite",
    logging: false,
});
exports.Models = {};
async function init() {
    await exports.db.authenticate();
    // TODO: define models
    await exports.db.sync();
}
exports.init = init;
