import {
	Association,
	DataTypes,
	HasManyAddAssociationMixin,
	HasManyCountAssociationsMixin,
	HasManyCreateAssociationMixin,
	HasManyGetAssociationsMixin,
	HasManyHasAssociationMixin,
	HasManySetAssociationsMixin,
	HasManyAddAssociationsMixin,
	HasManyHasAssociationsMixin,
	HasManyRemoveAssociationMixin,
	HasManyRemoveAssociationsMixin,
	Model,
	Sequelize,
	InferAttributes,
	InferCreationAttributes,
	CreationOptional,
	NonAttribute,
	ForeignKey,
} from "sequelize";

import waifus from "./waifus.json";

export const db = new Sequelize({
	dialect: "sqlite",
	storage: "db.sqlite",
	logging: false,
});

export class User extends Model<
	InferAttributes<User, { omit: "waifus" }>,
	InferCreationAttributes<User, { omit: "waifus" }>
> {
	// foreign keys are automatically added by associations methods (like User.belongsTo)
	// by branding them using the `ForeignKey` type,
	declare id: string;
	declare username: string;
	declare discriminator: string;
	declare avatarUrl?: string | null;
	declare lockedWaifus: string[];
	declare guaranteeWaifu?: string | null;
	declare guaranteeCounter?: number | null;
	declare dogfightKills: number;
	declare dogfightDeaths: number;
	declare dogfightWinstreak: number;
	declare airrecQuizWins: number;
	declare airrecQuizLosses: number;
	declare airrecQuizWinstreak: number;

	// Since TS cannot determine model association at compile time
	// we have to declare them here purely virtually
	// these will not exist until `Model.init` was called.
	declare getWaifus: HasManyGetAssociationsMixin<Waifu>; // Note the null assertions!
	declare addWaifu: HasManyAddAssociationMixin<Waifu, number>;
	declare addWaifus: HasManyAddAssociationsMixin<Waifu, number>;
	declare setWaifus: HasManySetAssociationsMixin<Waifu, number>;
	declare removeWaifu: HasManyRemoveAssociationMixin<Waifu, number>;
	declare removeWaifus: HasManyRemoveAssociationsMixin<Waifu, number>;
	declare hasWaifu: HasManyHasAssociationMixin<Waifu, number>;
	declare hasWaifus: HasManyHasAssociationsMixin<Waifu, number>;
	declare countWaifus: HasManyCountAssociationsMixin;
	declare createWaifu: HasManyCreateAssociationMixin<Waifu, "userId">;

	// You can also pre-declare possible inclusions, these will only be populated if you
	// actively include a relation.
	// We tag it as `NonAttribute`
	declare waifus?: NonAttribute<Waifu[]>; // Note this is optional since it's only populated when explicitly requested in code
	declare static associations: {
		waifus: Association<User, Waifu>;
	};

	// createdAt can be undefined during creation
	declare createdAt: CreationOptional<Date>;
	// updatedAt can be undefined during creation
	declare updatedAt: CreationOptional<Date>;
}

export class Waifu extends Model<
	InferAttributes<Waifu>,
	InferCreationAttributes<Waifu>
> {
	// foreign keys are automatically added by associations methods (like User.belongsTo)
	// by branding them using the `ForeignKey` type, `User.init` will know it does not need to
	// display an error if userId is missing.
	declare id: CreationOptional<number>;
	declare userId: ForeignKey<User["id"]>;
	declare name: string;
	declare atk: number;
	declare hp: number;
	declare spd: number;
	declare spec: boolean;
	declare generated?: boolean; // if the waifu was generated in by an admin
	declare kills: number;
	declare deaths: number;

	// `user` is an eagerly-loaded association.
	// We tag it as `NonAttribute`
	declare user: NonAttribute<User>;

	// createdAt can be undefined during creation
	declare createdAt: CreationOptional<Date>;
	// updatedAt can be undefined during creation
	declare updatedAt: CreationOptional<Date>;
}

User.init(
	{
		id: {
			type: DataTypes.STRING,
			autoIncrement: false,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING(32 + 5),
			allowNull: false,
		},
		discriminator: {
			type: DataTypes.STRING(4),
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
	},
	{
		sequelize: db,
		tableName: "Users",
	}
);

Waifu.init(
	{
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
		spec: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
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
	},
	{
		sequelize: db,
		tableName: "Waifus",
	}
);

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
