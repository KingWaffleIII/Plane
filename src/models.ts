import { DataTypes, Sequelize } from "sequelize";

export const db = new Sequelize({
	dialect: "sqlite",
	storage: "./db.sqlite",
	logging: false,
});

export const Models = {};

export async function init() {
	await db.authenticate();
	// TODO: define models
	await db.sync();
}
