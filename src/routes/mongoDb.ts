/**
 *These are the routes around interacting with the mongodb database
 **/
import express from "express";
import bcrypt from "bcrypt";
import { getRandomInt } from "../helpers";
import { Item } from "../schema";
import { BCRYPT_SALT_ROUND } from "../constants";

const router = express.Router({
  mergeParams: true,
});

router.get("/mockCreation", async (req, res) => {
  const createdItem = new Item({
    addedDate: Date.now() - getRandomInt(1000000, 1000000000),
    frequency: getRandomInt(1, 10),
    unit: "day",
    name: "test item",
    upc: getRandomInt(1, 999999999999).toString().padStart(12, "0"),
    images: ["www.test.com"],
    imageToUseIndex: 0,
    fullscreenImage: "www.test.com",
    lastUpdatedDate: Date.now(),
  });

  try {
    await createdItem.save();
    res.send({ createdItem });
  } catch (error) {
    res.send({ error });
  }
});

router.post("/password", async (req, res) => {
  const { username, password } = req.body;
  console.log({ username, password });
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    if (err) {
      res.status(500).send({ err });
      return;
    }

    console.log({ hash });
    res.send({ hash });
  });
});

router.post("/passwordCompare", async (req, res) => {
    const { hash, password } = req.body;
    console.log({ hash, password });
    bcrypt.compare(password, hash, function (err, result) {
      if (err) {
        res.status(500).send({ err });
        return;
      }
  
      console.log({ result });
      res.send({ result });
    });
  });

export default router;
