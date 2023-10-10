'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ride extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Ride.belongsTo(models.User, {
        foreignKey: 'userId'
      });
      Ride.belongsTo(models.Driver, {
        foreignKey: 'driverId'
      });
    }
  }
  Ride.init({
    fromAddress: DataTypes.STRING,
    toAddress: DataTypes.STRING,
    fromLocation: DataTypes.STRING,
    toLocation: DataTypes.STRING,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    amount: DataTypes.DECIMAL,
    distance: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    note: DataTypes.STRING,
    taxiType: DataTypes.STRING,
    paymentMethod: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Ride',
  });
  return Ride;
};