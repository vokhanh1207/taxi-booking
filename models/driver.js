'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Driver.hasMany(models.Ride, {
        foreignKey: 'driverId'
      });
      models.Driver.hasOne(models.Car, {
        foreignKey: 'driverId'
      });
    }
  }
  Driver.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    mobile: DataTypes.STRING,
    idNumber: DataTypes.STRING,
    avatar: DataTypes.STRING,
    cardIdFront: DataTypes.STRING,
    cardIdBack: DataTypes.STRING,
    driverLicenseFront: DataTypes.STRING,
    driverLicenseBack: DataTypes.STRING,
    status: DataTypes.STRING,
    currentLocation: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Driver',
  });
  return Driver;
};