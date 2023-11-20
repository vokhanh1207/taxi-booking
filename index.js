"use strict";
const express = require("express");
const app = express();
const port = process.env.PORT || 2000;
const expressHandlebars = require("express-handlebars");
const authController = require("./controller/authController");
const rideController = require("./controller/rideController");
const driverController = require("./controller/driverController");
const userController = require("./controller/userController");
const signUpController = require("./controller/signUpController");
const passport = require("./controller/passport");
const flash = require("connect-flash");
const session = require("express-session");
const {
  RIDE_STATUS,
  DRIVER_STATUS,
  CUSTOMER_STATUS,
} = require("./controller/constants");
const Handlebars = require("handlebars");
let models = require("./models");
const Utils = require("./controller/utils");

Handlebars.registerHelper("ifeq", function (a, b, options) {
  if (a == b) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper("ifnoteq", function (a, b, options) {
  if (a != b) {
    return options.fn(this);
  }
  return options.inverse(this);
});
// cau hinh public folder
// app.use(express.static('views'));
app.use(express.static(__dirname + "/assets"));
app.use(express.static(__dirname + "/public"));

app.engine(
  "hbs",
  expressHandlebars.engine({
    layoutsDir: __dirname + "/views/layouts",
    partialsDir: __dirname + "/views/partials",
    extname: "hbs",
    defaultLayout: "layout",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);

app.set("view engine", "hbs");
app.use(
  session({
    secret: "s3cret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 200 * 60 * 1000,
    },
  })
);
//cau hinh su dung passport
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// cau hinh doc du lieu post
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/createTables", (req, res) => {
  let models = require("./models");
  models.sequelize.sync().then(() => {
    res.send("Tables created successfully!");
  });
});
app.set("rideAndDriverSkipped", new Map());
app.set("activeDrivers", new Map());
app.get("/login", authController.show);
app.post("/login", authController.login);

app.get("/driver-login", authController.showDriverLogin);
app.post("/driver-login", authController.driverLogin);
app.get("/logout", authController.logout);

app.get("/sign-up", signUpController.customerSignupShow);
app.post("/sign-up", signUpController.customerSignupAdd);
app.get("/driver-sign-up", signUpController.driverSignupShow);
app.post("/driver-sign-up", signUpController.driverSignupAdd);
app.use(authController.isLoggedIn);

// Pages
app.get("/", (req, res) => {
  res.render("index", {
    user: req.user,
    userStringified: JSON.stringify(req.user),
  });
});

app.get("/driver", (req, res) => {
  if (!req.user.car_id) {
    return res.redirect("/");
  }

  res.render("driver", {
    user: req.user,
    userStringified: JSON.stringify(req.user),
    isDriver: true,
  });
});

app.get("/admin/kyc", async (req, res) => {
  if (!req.user.isAdmin) {
    return res.redirect("/");
  }
  let models = require("./models");
  const drivers = await models.Driver.findAll({
    where: {
      status: DRIVER_STATUS.Pending,
    },
  });

  res.render("kyc", {
    user: req.user,
    drivers,
  });
});

app.get("/admin/kyc/:id", async (req, res) => {
  if (!req.user.isAdmin) {
    return res.redirect("/");
  }

  const approve = req.query.approve;

  const driver = await models.Driver.findOne({
    where: {
      id: req.params.id,
    },
  });

  const car = await models.Car.findOne({
    where: {
      driverId: driver.id,
    },
  });

  if (approve) {
    driver.status = DRIVER_STATUS.Inactive;
    await driver.save();
  }

  res.render("kyc-details", {
    user: req.user,
    driver,
    car,
  });
});

app.get("/bookings", async (req, res) => {
  let where = {};

  // if driver
  if (req.user.car_id) {
    where = {
      driver_id: req.user.id,
    };
  } else {
    where = {
      customer_id: req.user.id,
    };
  }
  let rides = await models.Ride.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: 100,
  });
  rides = rides.map((ride) => {
    ride.createdAtFormatted = ride.createdAt.toLocaleString("vi-VN");
    ride.amountFormatted = Utils.numberWithCommas(ride.amount);
    // 9657m -> 9700m -> 9.7km
    ride.fomattedDistance = Math.ceil(ride.distance / 100) / 10 + " KM";
    return ride;
  });

  res.render("bookings", {
    user: req.user,
    rides,
  });
});

// APIs
app.post("/book", rideController.book);
app.get("/book/:rideId", rideController.getBooking);
app.post("/cancel", rideController.cancel);
app.get("/user/ongoingRide", userController.ongoingRide);
app.get("/user/getDrivers", userController.getDrivers);

// driver
app.post("/driver/ready", driverController.ready);
app.get("/driver/checkBooking", driverController.checkBooking);
app.post("/driver/cancelWaiting", driverController.cancelWaiting);
app.post("/driver/cancelRide", driverController.cancelRide);
app.post("/driver/acceptRide", driverController.acceptRide);
app.post("/driver/confirmPicking", driverController.confirmPicking);
app.post("/driver/complete", driverController.complete);
app.post("/driver/skipRide", driverController.skipRide);
app.get("/driver/currentRide", driverController.currentRide);

app.get("/driver/driver-complete", (req, res) => {
  res.render("complete-page");
});

// check remove active driver.
(() => {
  setInterval(async () => {
    const activeDrivers = app.get("activeDrivers");
    const now = Date.now();
    for (let [driverId, lastActive] of activeDrivers) {
      if (now - lastActive > 9 * 1000) {
        const driver = await models.Driver.findOne({
          where: {
            id: driverId,
          },
        });

        if (!driver) {
          continue;
        }

        driver.status = DRIVER_STATUS.Inactive;
        await driver.save();
        activeDrivers.delete(driverId);
      }
    }
  }, 10 * 1000);
})();
//khoi dong web server
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
