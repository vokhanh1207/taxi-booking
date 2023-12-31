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
    }
  }
  Car.init({
    avatar: DataTypes.STRING,
    name: DataTypes.STRING,
    year: DataTypes.INTEGER,
    seat: DataTypes.INTEGER,
    status: DataTypes.STRING,
    company_id: DataTypes.STRING,
    car_style_id: DataTypes.STRING,
    vehicle_id: DataTypes.STRING,
    type_car_id: DataTypes.STRING,
    licensePlate: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Car',
    tableName: 'cars',
  });
  return Car;
};