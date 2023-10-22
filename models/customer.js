'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Customer extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Customer.hasMany(models.Ride, {
        foreignKey: 'customer_id'
      });
      Customer.hasMany(models.Payment, {
        foreignKey: 'customerId'
      });
    }
  }
  Customer.init({
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    password: DataTypes.STRING,
    status: DataTypes.STRING,
    gender: DataTypes.STRING,
    avatar: DataTypes.STRING,
    // email: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'customers'
  });
  return Customer;
};