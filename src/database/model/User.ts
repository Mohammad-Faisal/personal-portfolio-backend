// import Sequelize from 'sequelize';

// Option 1: Passing a connection URI
// const sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname'); // Example for postgres

// Option 3: Passing parameters separately (other dialects)
// const sequelize = new Sequelize('database', 'username', 'password', {
//   host: 'localhost',
//   dialect: /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
// });

import { Sequelize, DataTypes, Model } from 'sequelize';
const sequelize = new Sequelize('sqlite::memory:');

export class User extends Model {
  declare lastName: string;
}

User.init(
  {
    userId: { type: DataTypes.TEXT, primaryKey: true }, // will not allow duplicate data
    userCount: { type: DataTypes.INTEGER, autoIncrement: true }, // will  increment the field
    userName: { type: DataTypes.STRING, unique: 'compositeIndex' }, // will not allow duplicate data
    userAddress: { type: DataTypes.STRING, field: 'user_address' }, // will not allow duplicate data
    firstName: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    registrationDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }, // automatic current date
  },
  {
    sequelize, // We need to pass the connection instance
    modelName: 'User', // We need to choose the model name
    tableName: 'User', // Custom table name
    indexes: [{ unique: true, fields: ['userName'] }],
  },
);

// User.sync({ alter: true }) -> to sync the database with the model. But not recommended in production
