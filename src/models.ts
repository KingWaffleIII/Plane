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

// 'users' is excluded as it's not an attribute, it's an association.
export class Guild extends Model<
	InferAttributes<Guild, { omit: "users" }>,
	InferCreationAttributes<Guild, { omit: "users" }>
> {
	declare id: string;
	declare name: string;

	// createdAt can be undefined during creation
	declare createdAt: CreationOptional<Date>;
	// updatedAt can be undefined during creation
	declare updatedAt: CreationOptional<Date>;

	// Since TS cannot determine model association at compile time
	// we have to declare them here purely virtually
	// these will not exist until `Model.init` was called.
	declare getUsers: HasManyGetAssociationsMixin<User>; // Note the null assertions!
	declare addUser: HasManyAddAssociationMixin<User, string>;
	declare addUsers: HasManyAddAssociationsMixin<User, string>;
	declare setUsers: HasManySetAssociationsMixin<User, string>;
	declare removeUser: HasManyRemoveAssociationMixin<User, string>;
	declare removeUsers: HasManyRemoveAssociationsMixin<User, string>;
	declare hasUser: HasManyHasAssociationMixin<User, string>;
	declare hasUsers: HasManyHasAssociationsMixin<User, string>;
	declare countUsers: HasManyCountAssociationsMixin;
	declare createUser: HasManyCreateAssociationMixin<User, "guildId">;

	// You can also pre-declare possible inclusions, these will only be populated if you
	// actively include a relation.
	declare users: NonAttribute<User[]>; // Note this is optional since it's only populated when explicitly requested in code

	declare static associations: {
		users: Association<User, User>;
	};
}

export class User extends Model<
	InferAttributes<User>,
	InferCreationAttributes<User>
> {
	declare id: string;

	// foreign keys are automatically added by associations methods (like User.belongsTo)
	// by branding them using the `ForeignKey` type, `User.init` will know it does not need to
	// display an error if guildId is missing.
	declare guildId: ForeignKey<Guild["id"]>;
	declare username: string;

	declare lockedWaifus?: string[];
	declare unlockedWaifus?: string[];

	// `guild` is an eagerly-loaded association.
	// We tag it as `NonAttribute`
	declare guild: NonAttribute<Guild>;

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
			type: new DataTypes.STRING(32 + 5),
			allowNull: false,
		},
		lockedWaifus: {
			type: new DataTypes.JSON(),
			allowNull: false,
			defaultValue: Object.keys(waifus),
		},
		unlockedWaifus: {
			type: new DataTypes.JSON(),
			allowNull: false,
			defaultValue: [],
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		sequelize: db,
		tableName: "Users",
	}
);

Guild.init(
	{
		id: {
			type: DataTypes.STRING,
			autoIncrement: false,
			primaryKey: true,
		},
		name: {
			type: new DataTypes.STRING(),
			allowNull: false,
		},
		createdAt: DataTypes.DATE,
		updatedAt: DataTypes.DATE,
	},
	{
		tableName: "Guilds",
		sequelize: db,
	}
);

// Here we associate which actually populates out pre-declared `association` static and other methods.
Guild.hasMany(User, {
	sourceKey: "id",
	// foreignKey: "guildId",
	as: "users", // this determines the name in `associations`!
});
User.belongsTo(Guild, { targetKey: "id" });
