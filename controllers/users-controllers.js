const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const User = require("../models/user");

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
  const { name, email, password } = req.body;
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
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (error) {
    const err = new HttpError("Creating user failed, please try again", 500);
    return next(error);
  }
  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again", 500);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        userEmail: newUser.email,
      },
      "supersecret_donttell_anyone",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again", 500);
    return next(error);
  }
  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
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

  if (!user) {
    const error = new HttpError("No user found", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, user.password);
  } catch (error) {
    const err = new HttpError(
      "Could not log you in, please check your credentials",
      500
    );
    return next(err);
  }

  if (!isValidPassword) {
    const err = new HttpError(
      "Could not log you in, please check your credentials",
      500
    );
    return next(err);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      "supersecret_donttell_anyone",
      { expiresIn: "1h" }
    );
  } catch (error) {
    const err = new HttpError(
      "Could not log you in, please try again later",
      500
    );
    return next(err);
  }

  res.json({ userId: newUser.id, email: newUser.email, token: token });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;
