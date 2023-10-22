"use strict";

const controller = {};
const sequelize = require("sequelize");
const {RIDE_STATUS, CUSTOMER_STATUS} = require("./constants");
const models = require("../models");
const passport = require("./passport");

controller.book = async (req, res) => {

  const rideOjb = {
    createAt: sequelize.fn("NOW"),
    updatedAt: sequelize.fn("NOW"),
    status: RIDE_STATUS.Finding,

    from_address_lat: req.body.from_address_lat,
    from_address_lng: req.body.from_address_lng,
    to_address_lat: req.body.to_address_lat,
    to_address_lng: req.body.to_address_lng,

    from_address: req.body.from_address,
    to_address: req.body.to_address,

    customer_id: req.user.id,
    
    note: req.body.note,
    amount: req.body.amount,
    // paymentMethod: req.body.paymentMethod,
    distance: req.body.distance,
    type_car_id: req.body.type_car_id || '5464cc23-9e76-401f-81e5-00fae2630d3a',
  };

  const customer = await models.Customer.findOne({
    where: {
      id: req.user.id,
    },
  });

  rideOjb.name = customer?.name;
  rideOjb.phone = customer?.phone;
  const newRide = await models.Ride.create(rideOjb);

  customer.status = CUSTOMER_STATUS.Waiting;
  customer.save();
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

  const customer = await models.Customer.findOne({ where: { id: ride.customer_id } });
  customer.status = CUSTOMER_STATUS.NoRide;
  await customer.save();

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
  if(ride.driver_id) {
    driver = await models.Driver.findOne({
      where: {
        id: ride.driver_id,
      },
    });

    car = await models.Car.findOne({
      where: {
        id: driver.car_id,
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
