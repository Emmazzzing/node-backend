const uuid = require("uuid");
const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");
const User = require("../models/user");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "mark",
    email: "sfsdsf@test.com",
    password: "sdfafasf",
  },
];

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "fatching users failed, please try again later",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  const { name, email, password, places } = req.body;
  let hasUser;
  try {
    hasUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "can not sign up now, please try again later",
      500
    );
    return next(error);
  }

  if (hasUser) {
    const error = new HttpError("User already exits", 422);
    return next(error);
  }
  const newUser = new User({
    name,
    email,
    image: "https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg",
    password,
    places,
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({ users: newUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login failed, please try again", 500);
    return next(error);
  }
  if (!user || user.password !== password) {
    const error = new HttpError("No user found or your password is wrong", 401);
    return next(error);
  }
  res.json({ message: "login!" });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;
