const express = require("express");
const bodyParser = require("body-parser");
const placeRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");
const app = express();

app.use("/api/places", placeRoutes);
app.use("/api/users", userRoutes);

app.use((error, req, res, next) => {
  //if already sent back response means no error
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.listen(5000);
