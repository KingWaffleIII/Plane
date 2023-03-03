import { DataTypes, Sequelize } from "sequelize";
import waifus from "./waifus.json";

export const db = new Sequelize({
	dialect: "sqlite",
	storage: "./db.sqlite",
	logging: false,
});

export function defineModels() {
	const Guild = db.define("Guild", {
		id: {
			type: DataTypes.STRING,
			autoIncrement: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	});
	const User = db.define("User", {
		id: {
			type: DataTypes.STRING,
			autoIncrement: false,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		lockedWaifus: {
			type: DataTypes.JSON,
			allowNull: false,
			defaultValue: Array.from(Object.keys(waifus)),
		},
		unlockedWaifus: {
			type: DataTypes.JSON,
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

export async function init() {
	await db.authenticate();
	defineModels();
	await db.sync();
}
