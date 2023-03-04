"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Guild = exports.db = void 0;
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
User.init({
    id: {
        type: sequelize_1.DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    username: {
        type: new sequelize_1.DataTypes.STRING(32 + 5),
        allowNull: false,
    },
    lockedWaifus: {
        type: new sequelize_1.DataTypes.JSON(),
        allowNull: false,
        defaultValue: Object.keys(waifus_json_1.default),
    },
    unlockedWaifus: {
        type: new sequelize_1.DataTypes.JSON(),
        allowNull: false,
        defaultValue: [],
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: exports.db,
    tableName: "Users",
});
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
// Here we associate which actually populates out pre-declared `association` static and other methods.
Guild.hasMany(User, {
    sourceKey: "id",
    // foreignKey: "guildId",
    as: "users", // this determines the name in `associations`!
});
User.belongsTo(Guild, { targetKey: "id" });
