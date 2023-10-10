"use strict";
const express = require("express");
const app = express();
const port = process.env.PORT || 2000;
const expressHandlebars = require("express-handlebars");
const authController = require("./controller/authController");
const rideController = require("./controller/rideController");
const driverController = require("./controller/driverController");
const passport = require("./controller/passport");
const flash = require("connect-flash");
const session = require("express-session");

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

app.get("/login", authController.show);
app.post("/login", authController.login);

app.get("/driver-login", authController.showDriverLogin);
app.post("/driver-login", authController.driverLogin);

app.use(authController.isLoggedIn);

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.post("/book", rideController.book);
app.get("/book/:rideId", rideController.getBooking);
app.post("/cancel", rideController.cancel);

// driver
app.get("/driver", (req, res) => {
  res.render("driver", {
    user: req.user,
    isDriver: true,
  });
});

app.post("/driver/ready", driverController.ready);
app.get("/driver/checkBooking", driverController.checkBooking);
app.post("/driver/cancelWaiting", driverController.cancelWaiting);
app.post("/driver/acceptRide", driverController.acceptRide);
app.post("/driver/complete", driverController.complete);
app.get("/driver/driver-complete", (req, res) => {
    res.render("complete-page")
});

//khoi dong web server
app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
