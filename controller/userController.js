"use strict";

const controller = {};
const sequelize = require("sequelize");
const { RIDE_STATUS, DRIVER_STATUS, CUSTOMER_STATUS } = require("./constants");
const models = require("../models");
const passport = require("./passport");

controller.getDrivers = async (req, res) => {
  const drivers = await models.Driver.findAll({
    where: {
      status: DRIVER_STATUS.Ready,
    },
  });

  return res.json({
    success: true,
    drivers: drivers,
  });
};

controller.ongoingRide = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const customer = await models.Customer.findOne({
    where: {
      id: req.user.id,
    },
  });

  let ride = null;
  if(customer && customer.status !== CUSTOMER_STATUS.NoRide) {
    ride = await models.Ride.findOne({
      where: {
        customer_id: customer.id,
        status: {
          [sequelize.Op.notIn]: [RIDE_STATUS.Canceled, RIDE_STATUS.Completed],
        }
      },
    });
  }

  return res.json({
    success: true,
    user: customer,
    ride
  });
};
module.exports = controller;
