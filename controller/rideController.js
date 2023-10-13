"use strict";

const controller = {};
const sequelize = require("sequelize");
const {RIDE_STATUS, USER_STATUS} = require("./constants");
const models = require("../models");
const passport = require("./passport");

controller.book = async (req, res) => {
  const rideOjb = {
    fromAddress: req.body.fromAddress,
    toAddress: req.body.toAddress,
    fromLocation: req.body.fromLocation,
    toLocation: req.body.toLocation,
    createAt: sequelize.fn("NOW"),
    userId: req.user.id,
    status: RIDE_STATUS.Finding,
    note: req.body.note,
    amount: req.body.amount,
    taxiType: req.body.taxiType,
    paymentMethod: req.body.paymentMethod,
    distance: req.body.distance,
  };

  const newRide = await models.Ride.create(rideOjb);

  const user = await models.User.findOne({
    where: {
      id: req.user.id,
    },
  });
  user.status = USER_STATUS.Waiting;
  user.save();
  req.app.get('rideAndDriverSkipped').set(newRide.id, []);

  return res.json({
    success: true,
    ride: newRide,
  });
};

controller.cancel = async (req, res) => {
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

  const user = await models.User.findOne({ where: { id: ride.userId } });
  user.status = USER_STATUS.NoRide;
  await user.save();

  ride.status = RIDE_STATUS.Canceled;
  await ride.save();

  return res.json({
    success: true,
  });
};

controller.getBooking = async (req, res) => {
  const rideId = req.params.rideId;
  const ride = await models.Ride.findOne({
    where: {
      id: rideId,
    },
  });

  if (!ride) {
    return res.json({
      success: false,
    });
  }

  let driver = null;
  let car = null;
  if(ride.driverId) {
    driver = await models.Driver.findOne({
      where: {
        id: ride.driverId,
      },
    });

    car = await models.Car.findOne({
      where: {
        driverId: driver.id,
      },
    });
  }

  return res.json({
    success: true,
    ride,
    driver,
    car
  });
};

module.exports = controller;
