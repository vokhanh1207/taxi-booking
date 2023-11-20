"use strict";

const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const models = require("../models");
const {
  RIDE_STATUS,
  DRIVER_STATUS,
  CUSTOMER_STATUS,
} = require("../controller/constants");

// duoc goi sau khi xac thuc thanh cong va luu thong tin user
passport.serializeUser((user, done) => {
  done(null, user);
});

// ham duoc goi boi passport.session() de lay thong tin user
passport.deserializeUser(async (user, done) => {
  try {
    let currentUser = null;
    const query = {
      attributes: ["id", "phone", "name", "status", "avatar"],
      where: { id: user.id },
    };

    // if user is driver
    console.log('deserializeUser', user);
    if (user.car_id) {
      query.attributes.push("car_id", "current_lat", "current_lng");
      currentUser = await models.Driver.findOne(query);
    } else {
      currentUser = await models.Customer.findOne(query);
    }
    done(null, currentUser);
  } catch (error) {
    done(error, null);
  }
});

// xac thuc user
passport.use(
  "local-login",
  new LocalStrategy(
    {
      usernameField: "phone",
      passwordField: "password",
      passReqToCallback: true, // cho phep truyen req vao callback
    },
    async (req, phone, password, done) => {
      if (phone) {
        phone = phone.toLowerCase();
      }

      try {
        if (!req.user) {
          // user chua dang nhap
          let user = await models.Customer.findOne({ where: { phone: phone } });
          if (!user) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Số điện thoại không tồn tại")
            );
          }

          const passMatched = bcrypt.compareSync(password, user.password);

          if (!passMatched) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Sai mật khẩu")
            );
          }

          return done(null, user);
        }

        // bo qua dang nhap
        done(null, req.user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  "driver-login-passport",
  new LocalStrategy(
    {
      usernameField: "phone",
      passwordField: "password",
      passReqToCallback: true, // cho phep truyen req vao callback
    },
    async (req, phone, password, done) => {
      if (phone) {
        phone = phone.toLowerCase();
      }

      try {
        if (!req.user) {
          // user chua dang nhap
          let driver = await models.Driver.findOne({
            attributes: [
              "id",
              "phone",
              "name",
              "status",
              "avatar",
              "password",
              "car_id",
              "current_lat",
              "current_lng",
            ],
            where: { phone },
          });
          if (!driver) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Số điện thoại chưa được đăng ký.")
            );
          }

          const passMatched = bcrypt.compareSync(password, driver.password);

          if (!passMatched) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Sai mật khẩu.")
            );
          }

          if (driver.status === DRIVER_STATUS.Init) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Tài khoản chưa được duyệt.")
            );
          }

          driver.status = DRIVER_STATUS.Inactive;
          driver = await driver.save();
          return done(null, driver);
        }

        // bo qua dang nhap
        done(null, req.user);
      } catch (error) {
        done(error);
      }
    }
  )
);

module.exports = passport;
