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
        foreignKey: 'driver_id'
      });
      // models.Driver.hasOne(models.Car, {
      //   foreignKey: 'car_id'
      // });
    }
  }
  Driver.init({
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    name: DataTypes.STRING,
    avatar: DataTypes.STRING,
    gender: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    status: DataTypes.STRING,
    car_id: DataTypes.STRING,
    current_lat: DataTypes.STRING,
    current_lng: DataTypes.STRING,

    // email: DataTypes.STRING,
    // password: DataTypes.STRING,
    // firstName: DataTypes.STRING,
    // lastName: DataTypes.STRING,
    // mobile: DataTypes.STRING,
    // idNumber: DataTypes.STRING,
    // avatar: DataTypes.STRING,
    // cardIdFront: DataTypes.STRING,
    // cardIdBack: DataTypes.STRING,
    // driverLicenseFront: DataTypes.STRING,
    // driverLicenseBack: DataTypes.STRING,
    // status: DataTypes.STRING,
    // currentLocation: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers'
  });
  return Driver;
};