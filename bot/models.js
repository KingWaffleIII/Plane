"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.defineModels = exports.db = void 0;
const sequelize_1 = require("sequelize");
const waifus_json_1 = __importDefault(require("./waifus.json"));
exports.db = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "./db.sqlite",
    logging: false,
});
function defineModels() {
    const Guild = exports.db.define("Guild", {
        id: {
            type: sequelize_1.DataTypes.STRING,
            autoIncrement: false,
            primaryKey: true,
        },
        name: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
    });
    const User = exports.db.define("User", {
        id: {
            type: sequelize_1.DataTypes.STRING,
            autoIncrement: false,
            primaryKey: true,
        },
        username: {
            type: sequelize_1.DataTypes.STRING,
            allowNull: false,
        },
        lockedWaifus: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: Array.from(Object.keys(waifus_json_1.default)),
        },
        unlockedWaifus: {
            type: sequelize_1.DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
        },
    });
    Guild.hasMany(User, {
        foreignKey: "guild",
        onDelete: "SET NULL",
    });
    User.belongsTo(Guild);
}
exports.defineModels = defineModels;
async function init() {
    await exports.db.authenticate();
    defineModels();
    await exports.db.sync();
}
exports.init = init;
