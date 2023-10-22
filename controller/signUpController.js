'use strict';

const controller = {};
const passport = require("passport");
const models = require("../models");
const bcrypt = require("bcrypt");

controller.customerSignupShow = (req, res) => {
    res.render("sign-up", { signUpMessage: req.flash('signUpMessage') });
}

controller.customerSignupAdd = async (req, res) => {
    const userExisted = await models.Customer.findOne({
        where: {
            phone: req.body.phone
        }
    });
    if (userExisted) {
        req.flash("signUpMessage", "Số điện thoại đã được đăng ký.");
        return res.redirect("/sign-up");
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const newUser = await models.Customer.create({
        name: req.body.name,
        phone: req.body.phone,
        password: hash,
        gender: req.body.gender,
        avatar: req.body.avatar,
    });

    if (!newUser) {
        req.flash("signUpMessage", "Đã xảy ra lỗi. Vui lòng thử lại.");
        return res.redirect("/sign-up");
    }

    req.flash("loginMessage", "Đăng ký thành công. Vui lòng đăng nhập.");
    return res.redirect("/login");
}

controller.driverSignupShow = async (req, res) => {
    res.render("driver-sign-up", { 
        signUpMessage: req.flash('signUpMessage'),
        successMessage: req.flash('successMessage'),
        ... (await getDriverSignUpMaterial())
    });
}

controller.driverSignupAdd = async (req, res) => {
    const driverExisted = await models.Driver.findOne({
        where: {
            phone: req.body.phone
        }
    });
    if (driverExisted) {
        req.flash("signUpMessage", "Số điện thoại đã được đăng ký.");
        return res.redirect("/driver-sign-up");
    }
    const carData = {
        avatar: req.body.car_avatar,
        name: req.body.car_name,
        year: new Date(req.body.car_year, 0).toISOString(),
        licensePlate: req.body.car_license_plate,
        status: 'ACTIVE',
        seat: req.body.car_seat,
        company_id: req.body.car_company_id,
        car_style_id: req.body.car_style_id,
        vehicle_id: req.body.car_vehicle,
        type_car_id: req.body.car_type_id,
    };

    const car = await models.Car.create(carData);
    if (!car) {
        req.flash("signUpMessage", "Không thể tạo xe.");
        return res.redirect("/driver-sign-up");
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const driveData = {
        name: req.body.name,
        avatar: req.body.avatar,
        gender: req.body.gender, 
        phone: req.body.phone, 
        password: hash,
        status: 'INIT',
        car_id: car.id,
    };

    const newDriver = await models.Driver.create(driveData);
    if (!newDriver) {
        req.flash("signUpMessage", "Đã xảy ra lỗi. Vui lòng thử lại.");
        return res.redirect("/driver-sign-up");
    }

    req.flash("successMessage", "Hồ sơ của bạn đã được gửi. Chúng tôi sẽ thông báo khi hồ sơ được duyệt.");
    return res.redirect("/driver-sign-up");
}

const getDriverSignUpMaterial = async () => {
    const carCompanies = await models.Company.findAll();
    const carVehicles = await models.Vehicle.findAll();
    const carStyles = await models.CarStyle.findAll();
    const carTypes = await models.TypeCar.findAll();

    return {
        carCompanies,
        carVehicles,
        carStyles,
        carTypes
    }
}
module.exports = controller;