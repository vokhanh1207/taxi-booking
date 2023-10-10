'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Car extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Car.belongsTo(models.Driver, {
        foreignKey: 'driverId'
      });
    }
  }
  Car.init({
    model: DataTypes.STRING,
    registrationNumber: DataTypes.STRING,
    color: DataTypes.STRING,
    taxiType: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Car',
  });
  return Car;
};