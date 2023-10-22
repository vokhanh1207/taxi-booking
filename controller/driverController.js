"use strict";

const controller = {};
const sequelize = require("sequelize");
const { RIDE_STATUS, DRIVER_STATUS, CUSTOMER_STATUS } = require("./constants");
const models = require("../models");
const passport = require("./passport");
const Utils = require("./utils");

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
  // driver.currentLocation = req.body.currentLocation;
  await driver.save();

  return res.json({
    success: true,
  });
};

controller.checkBooking = async (req, res) => {
  if (!req.user) {
    return res.json({
      success: false,
    });
  }

  const excludedRideIds = req.session.skippedRideIds || [];

  const ride = await models.Ride.findOne({
    where: {
      status: RIDE_STATUS.Finding,
      id: {
        [sequelize.Op.notIn]: excludedRideIds,
      },
      driver_id: null,
    },
    order: [["createdAt", "ASC"]],
  });

  if (!ride) {
    return res.json({
      success: false,
      message: "No booking yet",
    });
  }

  let closestDriver = req.user;
  const excludeDrivers = req.app.get('rideAndDriverSkipped').get(ride.id) || [];
  
  console.log('closestDriver', closestDriver);
  const drivers = await models.Driver.findAll({
    where: {
      status: DRIVER_STATUS.Ready,
      id: { [sequelize.Op.not]: [req.user.id, ...excludeDrivers] },
    },
  });

  if (drivers || drivers.length > 1) {
    const pickupLatLng = {
      lat: ride.from_address_lat,
      lng: ride.from_address_lng
    };
    drivers.forEach((driver) => {
      const itemLatLng = {
        lat: driver.current_lat,
        lng: driver.current_lng
      };
      const closestLatLng = {
        lat: closestDriver.current_lat,
        lng: closestDriver.current_lng,
      }
      const itemToUser = Utils.calcCrow(
        pickupLatLng.lat,
        pickupLatLng.lng,
        itemLatLng.lat,
        itemLatLng.lng
      );
      const closestToUser = Utils.calcCrow(
        pickupLatLng.lat,
        pickupLatLng.lng,
        closestLatLng.lat,
        closestLatLng.lng
      );
      if (itemToUser < closestToUser) {
        closestDriver = driver;
      }
    });
  }

  if (closestDriver.id !== req.user.id) {
    return res.json({
      success: false,
      message: "There is a closer driver",
    });
  }

  // temporarily store driver Id for the ride
  ride.driver_id = req.user.id;
  await ride.save();

  return res.json({
    success: true,
    ride: ride,
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
  console.log('driverIddriverId', driverId);
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

  ride.driver_id = driverId;
  ride.status = RIDE_STATUS.Picking;
  ride.startTime = sequelize.fn("NOW");
  await ride.save();

  driver.status = DRIVER_STATUS.Riding;
  await driver.save();

  return res.json({
    success: true,
    ride: ride,
  });
};

controller.cancelRide = async (req, res) => {
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
  if (!ride) {
    return res.json({
      success: false,
    });
  }

  ride.driver_id = null;
  ride.status = RIDE_STATUS.Finding;
  await ride.save();

  driver.status = DRIVER_STATUS.Inactive;
  await driver.save();

  req.session.skippedRideIds = req.session.skippedRideIds || [];
  req.session.skippedRideIds.push(rideId);

  return res.json({
    success: true
  });
};

controller.confirmPicking = async (req, res) => {
  if (!req.user) {
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
  if (!ride) {
    return res.json({
      success: false,
    });
  }

  ride.status = RIDE_STATUS.Riding;
  await ride.save();

  const customerId = ride.customer_id;
  if (customerId) {
    const customer = await models.Customer.findOne({
      where: {
        id: customerId,
      },
    });
    if (!customer) {
      return res.json({
        success: false,
      });
    }
    customer.status = CUSTOMER_STATUS.Riding;
    await customer.save(); 
  }

  req.app.get('rideAndDriverSkipped').delete(rideId);

  return res.json({
    success: true
  });
};

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
  if (!ride) {
    return res.json({
      success: false,
      message: 'Ride not found'
    });
  }

  const customerId = ride.customer_id;
  if (customerId) {
    const customer = await models.Customer.findOne({
      where: {
        id: customerId,
      },
    });
    if (customer) {
      customer.status = CUSTOMER_STATUS.NoRide;
      await customer.save();
    }
  }

  // const payment = {
  //   rideId: rideId,
  //   userId: userId,
  //   amount: ride.amount,
  //   type: ride.paymentMethod,
  //   createdAt: sequelize.fn("NOW"),
  //   updatedAt: sequelize.fn("NOW"),
  // };
  // await models.Payment.create(payment);

  ride.status = RIDE_STATUS.Completed;
  ride.endTime = sequelize.fn("NOW");
  await ride.save();

  driver.status = DRIVER_STATUS.Ready;
  await driver.save();

  return res.json({
    success: true,
  });
};

controller.skipRide = async (req, res) => {
  if (!req.user) {
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

  if (!ride) {
    return res.json({
      success: false,
    });
  }

  ride.driver_id = null;
  await ride.save();

  req.session.skippedRideIds = req.session.skippedRideIds || [];
  req.session.skippedRideIds.push(rideId);
  
  const driversSkipped = req.app.get('rideAndDriverSkipped').get(rideId) || [];
  driversSkipped.push(req.user.id);
  req.app.get('rideAndDriverSkipped').set(rideId, driversSkipped);

  return res.json({
    success: true,
  });
};

controller.currentRide = async (req, res) => {
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

  let ride = null;
  if (driver.status === DRIVER_STATUS.Riding) {
    ride = await models.Ride.findOne({
      where: {
        driver_id: driverId,
        status: {
          [sequelize.Op.notIn]: [RIDE_STATUS.Canceled, RIDE_STATUS.Completed],
        },
      },
    });
  }

  return res.json({
    success: true,
    ride: ride,
  });
}
module.exports = controller;
