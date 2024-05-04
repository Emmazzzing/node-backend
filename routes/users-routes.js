const express = require("express");
const router = express.Router();

const DUMMY_USERS = [
  {
    uid: "u1",
    name: "mark",
  },
];

router.get("/:uid", (req, res, next) => {
  const userId = req.params.uid;
  const user = DUMMY_USERS.find((u) => {
    return u.uid === userId;
  });
  res.json(user);
});

module.exports = router;
