const uuid = require("uuid");
const HttpError = require("../models/http-error");

const DUMMY_USERS = [
  {
    id: "u1",
    name: "mark",
    email: "sfsdsf@test.com",
    password: "sdfafasf",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};
const signup = (req, res, next) => {
  const { name, email, password } = req.body;
  const hasUser = DUMMY_USERS.find((u) => {
    u.email === email;
  });
  if (hasUser) {
    const error = new HttpError("User already exits", 402);
    return next(error);
  }
  const newUser = {
    id: uuid.v4,
    name,
    email,
    password,
  };
  DUMMY_USERS.push(newUser);
  res.status(201).json({ users: newUser });
};
const login = (req, res, next) => {
  const { email, password } = req.body;
  const user = DUMMY_USERS.find((u) => u.email === email);
  if (!user || user.password !== password) {
    const error = new HttpError("No user found or your password is wrong", 401);
    return next(error);
  }
  res.json({ message: "login!" });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;
