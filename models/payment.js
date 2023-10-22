'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Payment.belongsTo(models.Ride, {
        foreignKey: 'rideId'
      });
      Payment.belongsTo(models.User, {
        foreignKey: 'user_id'
      });
    }
  }
  Payment.init({
    rideId: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL,
    type: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};