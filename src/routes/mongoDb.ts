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
  const start = performance.now();
  bcrypt.hash(password, BCRYPT_SALT_ROUND, function (err, hash) {
    const end = performance.now();
    const diff = end - start;
    if (err) {
      res.status(500).send({ err });
      return;
    }

    console.log({ diff, hash });
    res.send({ diff, hash });
  });
});

router.post("/passwordCompare", async (req, res) => {
  const { hash, password } = req.body;
  console.log({ hash, password });
  const start = performance.now();
  bcrypt.compare(password, hash, function (err, result) {
    const end = performance.now();
    const diff = end - start;
    if (err) {
      res.status(500).send({ err });
      return;
    }

    console.log({ diff, result });
    res.send({ diff, result });
  });
});

router.post("/saveItem", async (req, res) => {
    const { item } = req.body;
    console.log({ item });
    const createdItem = new Item(item);
      const result = await createdItem.save();
      res.send({result});
  });

export default router;
