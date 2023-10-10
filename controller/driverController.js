"use strict";

const controller = {};
const sequelize = require("sequelize");
const {RIDE_STATUS, DRIVER_STATUS} = require("./constants");
const models = require("../models");
const passport = require("./passport");

controller.ready = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const driverId = req.user.id;
  const driver = await models.Driver.findOne({
    where: {
      id: driverId,
    },
  });
  if (!driver) {
    return res.json({
      success: false,
    });
  }

  driver.status = DRIVER_STATUS.Ready;
  await driver.save();

  return res.json({
    success: true,
  });
};


controller.checkBooking = async (req, res) => {
  const ride = await models.Ride.findOne({
    where: {
      status: RIDE_STATUS.Finding,
    },
    order: [ [ 'createdAt', 'DESC' ]],
  });

  if (!ride) {
    return res.json({
      success: false,
    });
  }

  return res.json({
    success: true,
    ride: ride
  });
};

controller.cancelWaiting = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const driverId = req.user.id;
  const driver = await models.Driver.findOne({
    where: {
      id: driverId,
    },
  });
  if (!driver) {
    return res.json({
      success: false,
    });
  }

  driver.status = DRIVER_STATUS.Inactive;
  await driver.save();

  return res.json({
    success: true,
  });
};

controller.acceptRide = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const driverId = req.user.id;
  const driver = await models.Driver.findOne({
    where: {
      id: driverId,
    },
  });
  if (!driver) {
    return res.json({
      success: false,
    });
  }

  const rideId = req.body.rideId;
  const ride = await models.Ride.findOne({
    where: {
      id: rideId,
    },
  });
  if (!ride || ride.status !== RIDE_STATUS.Finding) {
    return res.json({
      success: false,
    });
  }

  ride.driverId = driverId;
  ride.status = RIDE_STATUS.Picking;
  await ride.save();

  driver.status = DRIVER_STATUS.Riding;
  await driver.save();

  return res.json({
    success: true,
    ride: ride
  });
}

controller.complete = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const driverId = req.user.id;
  const driver = await models.Driver.findOne({
    where: {
      id: driverId,
    },
  });
  if (!driver) {
    return res.json({
      success: false,
    });
  }

  const rideId = req.body.rideId;
  const ride = await models.Ride.findOne({
    where: {
      id: rideId,
    },
  });
  if (!ride || ride.status !== RIDE_STATUS.Picking) {
    return res.json({
      success: false,
    });
  }

  ride.status = RIDE_STATUS.Completed;
  await ride.save();

  driver.status = DRIVER_STATUS.Ready;
  await driver.save();

  return res.json({
    success: true,
  });
}
module.exports = controller;
