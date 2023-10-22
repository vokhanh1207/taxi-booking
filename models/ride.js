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
      Ride.belongsTo(models.Customer, {
        foreignKey: 'customer_id'
      });
      Ride.belongsTo(models.Driver, {
        foreignKey: 'driver_id'
      });
      Ride.hasMany(models.Payment, {
        foreignKey: 'rideId'
      });
    }
  }
  Ride.init({
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    status: DataTypes.STRING,
    customer_id: DataTypes.STRING,
    driver_id: DataTypes.STRING,
    from_address_lat: DataTypes.INTEGER,
    from_address_lng: DataTypes.INTEGER,
    to_address_lat: DataTypes.INTEGER,
    to_address_lng: DataTypes.INTEGER,

    from_address: DataTypes.STRING,
    to_address: DataTypes.STRING,
    type_car_id: DataTypes.STRING,
    
    name: DataTypes.STRING,
    phone: DataTypes.STRING,

    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    amount: DataTypes.DECIMAL,
    distance: DataTypes.DECIMAL,
    note: DataTypes.STRING,
    paymentMethod: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Ride',
    tableName: 'book-cars'
  });
  return Ride;
};