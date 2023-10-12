'use strict';

const controller = {};
const passport = require('./passport');

controller.show = (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('login', { loginMessage: req.flash('loginMessage') });
};

controller.login = (req, res, next) => {
    passport.authenticate('local-login', (err, user) => {
        if(err) {
            return next(err);
        }

        if (!user) {
            return res.redirect('/login');
        }

        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
};


controller.showDriverLogin = (req, res) => {
    res.render('driver-login', { loginMessage: req.flash('loginMessage') });
};

controller.driverLogin = (req, res, next) => {
    passport.authenticate('driver-login-passport', (err, driver) => {
        if(err) {
            return next(err);
        }

        if (!driver) {
            return res.redirect('/driver-login');
        }

        req.logIn(driver, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/driver');
        });
    })(req, res, next);
};

controller.isLoggedIn = (req, res, next) => {
    if (req.user) {
        return next();
    }
    res.redirect('/login');
};

controller.logout = (req, res) => {
    req.logout((error) => {
        if (error) {
            console.log('Logout error: ', error);
        }
        res.redirect('/login');
    });
};

module.exports = controller;