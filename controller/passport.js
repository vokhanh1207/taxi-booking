"use strict";

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
// const bcript = require('bcrypt');
const models = require("../models");

// duoc goi sau khi xac thuc thanh cong va luu thong tin user
passport.serializeUser((user, done) => {
  done(null, user);
});

// ham duoc goi boi passport.session() de lay thong tin user
passport.deserializeUser(async (user, done) => {
  try {
    let currentUser = null;
    const query = {
      attributes: ["id", "email", "firstName", "lastName", "mobile"],
      where: { id: user.id },
    };

    // if user is driver
    console.log('deserializeUser', user);
    if (user.status) {
      query.attributes.push("status");
      currentUser = await models.Driver.findOne(query);
    } else {
      currentUser = await models.User.findOne(query);
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
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true, // cho phep truyen req vao callback
    },
    async (req, email, password, done) => {
      if (email) {
        email = email.toLowerCase();
      }

      try {
        if (!req.user) {
          // user chua dang nhap
          let user = await models.User.findOne({ where: { email: email } });
          if (!user) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Email does not exist")
            );
          }

          if (password != user.password) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Wrong password")
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
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: true, // cho phep truyen req vao callback
    },
    async (req, email, password, done) => {
      if (email) {
        email = email.toLowerCase();
      }

      try {
        if (!req.user) {
          // user chua dang nhap
          let driver = await models.Driver.findOne({
            attributes: [
              "id",
              "email",
              "firstName",
              "lastName",
              "mobile",
              "password",
              "status"
            ],
            where: { email: email },
          });
          if (!driver) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Email does not exist")
            );
          }

          if (password != driver.password) {
            return done(
              null,
              false,
              req.flash("loginMessage", "Wrong password")
            );
          }

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
