const axios = require("axios");
const API_KEY = "AIzaSyDjImR7z2SAgOGuQNHYsILBlWPck0bi0v";
const HttpError = require("../models/http-error");

async function getCorrdsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;
  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError(
      "could not find location for the specified address",
      422
    );
  }

  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCorrdsForAddress
