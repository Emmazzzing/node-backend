const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const getCorrdsForAddress = require("../util/location");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "something went wrong, coulnd not find a place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Fetching places failed, please try again later",
      500
    );
    return next(error);
  }

  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find a place for the provided user id.", 404)
    );
  }
  res.json({
    places: userWithPlaces.places.map((p) => p.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCorrdsForAddress(address);
  } catch (error) {
    return next(error);
  }
  const createdPlace = new Place({
    title,
    description,
    location: coordinates,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/400px-Empire_State_Building_%28aerial_view%29.jpg",
    address,
    creator,
  });
  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("creating place failed, please try again", 500);
    return next(error);
  }
  if (!user) {
    const error = new HttpError("We could not find user for provided id", 404);
    return next(error);
  }
  console.log(user);
  //mongodb session 和 transaction 保证多个任务都完成之后 才执行下一步 如果有任务没有完成就会撤销完成的任务

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    //只会把id推进去
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("creating place failed, please try again", 500));
  }

  res.status(200).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "something went wrong, coulnd not update a place",
      500
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "something went wrong, coulnd not update a place",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const targetPlaceId = req.params.pid;
  let place;
  try {
    // populate 只能在两个表有交集的时候工作
    place = await Place.findById(targetPlaceId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "can not delete this place, please try again later",
      500
    );
    return next(error);
  }
  if (!place) {
    const error = new HttpError("Counld not find place for this id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess });
    //只会把id删掉
    place.creator.places.pull(place);
    //因为刚刚populate了 所以可以从这个表 到另一个表
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("can not delete this place", 500);
    return next(error);
  }
  res.status(200).json({ message: "deleted" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
