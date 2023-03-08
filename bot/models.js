"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waifu = exports.User = exports.Guild = exports.db = void 0;
const sequelize_1 = require("sequelize");
const waifus_json_1 = __importDefault(require("./waifus.json"));
exports.db = new sequelize_1.Sequelize({
    dialect: "sqlite",
    storage: "db.sqlite",
    logging: false,
});
// 'users' is excluded as it's not an attribute, it's an association.
class Guild extends sequelize_1.Model {
}
exports.Guild = Guild;
class User extends sequelize_1.Model {
}
exports.User = User;
class Waifu extends sequelize_1.Model {
}
exports.Waifu = Waifu;
Guild.init({
    id: {
        type: sequelize_1.DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    name: {
        type: new sequelize_1.DataTypes.STRING(),
        allowNull: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    tableName: "Guilds",
    sequelize: exports.db,
});
User.init({
    id: {
        type: sequelize_1.DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(32 + 5),
        allowNull: false,
    },
    lockedWaifus: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        defaultValue: Object.keys(waifus_json_1.default),
    },
    guaranteeWaifu: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    guaranteeCounter: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: exports.db,
    tableName: "Users",
});
Waifu.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    atk: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    hp: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    spd: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    spec: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
    },
    generated: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: exports.db,
    tableName: "Waifus",
});
// Here we associate which actually populates out pre-declared `association` static and other methods.
Guild.hasMany(User, {
    sourceKey: "id",
    // foreignKey: "guildId",
    as: "users", // this determines the name in `associations`!
});
User.belongsTo(Guild, { targetKey: "id" });
User.hasMany(Waifu, {
    sourceKey: "id",
    // foreignKey: "userId",
    as: "waifus", // this determines the name in `associations`!
});
Waifu.belongsTo(User, { targetKey: "id" });
