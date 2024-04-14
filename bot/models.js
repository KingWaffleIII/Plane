import { DataTypes, Model, Sequelize, } from "sequelize";
import waifus from "./waifus.json" assert { type: "json" };
export const db = new Sequelize({
    dialect: "sqlite",
    storage: "db.sqlite",
    logging: false,
});
export class Guild extends Model {
}
export class User extends Model {
}
export class Waifu extends Model {
}
Guild.init({
    id: {
        type: DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    waifusEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: db,
    tableName: "Guilds",
});
User.init({
    id: {
        type: DataTypes.STRING,
        autoIncrement: false,
        primaryKey: true,
    },
    username: {
        type: DataTypes.STRING(32),
        allowNull: false,
    },
    avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lockedWaifus: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: Object.keys(waifus),
    },
    dogfightKills: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    dogfightDeaths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    dogfightWinstreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    airrecQuizWins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    airrecQuizLosses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    airrecQuizWinstreak: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    guaranteeWaifu: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    guaranteeCounter: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: db,
    tableName: "Users",
});
Waifu.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    atk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    hp: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    spd: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    generated: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    kills: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    deaths: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
}, {
    sequelize: db,
    tableName: "Waifus",
});
// Here we associate which actually populates out pre-declared `association` static and other methods.
User.hasMany(Waifu, {
    // sourceKey: "id",
    foreignKey: "userId",
    as: "waifus", // this determines the name in `associations`!
});
Waifu.belongsTo(User, {
    // targetKey: "id",
    as: "user",
});
